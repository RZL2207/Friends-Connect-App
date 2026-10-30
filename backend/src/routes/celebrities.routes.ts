import { Router, Request, Response } from 'express';
import { db } from '../store';
import { CallSession } from '../types';

const router = Router();

// List all verified celebrities
router.get('/', (req: Request, res: Response): void => {
  const celebs = Array.from(db.users.values())
    .filter(u => u.role === 'CELEBRITY' && !u.isBlocked)
    .map(u => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      isVerified: u.isVerified,
      celebrityProfile: u.celebrityProfile
    }));

  res.json({ success: true, count: celebs.length, celebrities: celebs });
});

// Get single celebrity profile
router.get('/:id', (req: Request, res: Response): void => {
  const celebId = req.params.id as string;
  const celeb = db.users.get(celebId);
  if (!celeb || celeb.role !== 'CELEBRITY') {
    res.status(404).json({ success: false, message: 'Celebrity not found' });
    return;
  }

  res.json({
    success: true,
    celebrity: {
      id: celeb.id,
      name: celeb.name,
      avatarUrl: celeb.avatarUrl,
      isVerified: celeb.isVerified,
      celebrityProfile: celeb.celebrityProfile
    }
  });
});

// Toggle Celebrity Call Availability
router.post('/availability', (req: Request, res: Response): void => {
  const { celebrityId, isOnline } = req.body;
  const celeb = db.users.get(celebrityId);

  if (!celeb || celeb.role !== 'CELEBRITY' || !celeb.celebrityProfile) {
    res.status(404).json({ success: false, message: 'Celebrity profile not found' });
    return;
  }

  celeb.celebrityProfile.isOnlineForCalls = Boolean(isOnline);
  db.users.set(celeb.id, celeb);

  res.json({
    success: true,
    message: `Call status updated to ${isOnline ? 'Online' : 'Offline'}`,
    isOnlineForCalls: celeb.celebrityProfile.isOnlineForCalls
  });
});

// Request Paid Call (Audio or Video) to Celebrity
router.post('/:id/request-call', (req: Request, res: Response): void => {
  const celebId = req.params.id as string;
  const celeb = db.users.get(celebId);
  const { userId, callType = 'CELEBRITY_AUDIO' } = req.body;

  if (!celeb || celeb.role !== 'CELEBRITY' || !celeb.celebrityProfile) {
    res.status(404).json({ success: false, message: 'Celebrity not found' });
    return;
  }

  const caller = db.users.get(userId);
  if (!caller) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Check if caller is Premium or has sufficient wallet balance
  const ratePerMin = callType === 'CELEBRITY_VIDEO'
    ? celeb.celebrityProfile.videoRatePerMin
    : celeb.celebrityProfile.audioRatePerMin;

  if (!caller.isPremium && caller.walletBalance < ratePerMin) {
    res.status(402).json({
      success: false,
      message: 'Premium membership or minimum wallet balance required to call celebrities',
      requiredBalance: ratePerMin,
      currentBalance: caller.walletBalance,
      isPremium: caller.isPremium
    });
    return;
  }

  if (!celeb.celebrityProfile.isOnlineForCalls) {
    res.status(409).json({
      success: false,
      message: `${celeb.name} is currently offline or busy in another session.`
    });
    return;
  }

  // Create Call Session
  const sessionId = `call_${Date.now()}`;
  const roomName = `room_celeb_${sessionId}`;

  const callSession: CallSession = {
    id: sessionId,
    type: callType,
    callerId: caller.id,
    calleeId: celeb.id,
    roomName,
    status: 'RINGING',
    startedAt: new Date().toISOString(),
    cost: ratePerMin
  };

  db.callSessions.set(sessionId, callSession);

  res.json({
    success: true,
    message: `Initiating ${callType} call to ${celeb.name}`,
    callSession,
    rtcConfig: {
      roomName,
      // Ephemeral token simulation / LiveKit or Agora room credentials
      token: `rtc_token_${sessionId}`,
      turnServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  });
});

export default router;
