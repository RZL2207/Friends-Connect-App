import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../store';
import { User, UserRole } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'friendconnect-super-secure-jwt-secret-key-2026';

// Request OTP for Mobile Login
router.post('/send-otp', (req: Request, res: Response): void => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.length < 10) {
    res.status(400).json({ success: false, message: 'Valid phone number is required' });
    return;
  }

  // Generate 6-digit OTP (for dev/testing, fixed to 123456 or dynamic)
  const otp = '123456';
  db.activeOtps.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  });

  console.log(`[AUTH-OTP] Sent OTP ${otp} to phone: ${phone}`);
  res.json({
    success: true,
    message: 'OTP sent successfully',
    devOtpHint: 'For quick testing, use OTP: 123456'
  });
});

// Verify OTP & Authenticate
router.post('/verify-otp', (req: Request, res: Response): void => {
  const { phone, otp, role, name } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    return;
  }

  const stored = db.activeOtps.get(phone);
  if (!stored || stored.otp !== otp) {
    res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    return;
  }

  // Find or create user
  let user = Array.from(db.users.values()).find(u => u.phone === phone);
  if (!user) {
    const assignedRole: UserRole = role || 'NORMAL';
    user = {
      id: `usr_${Date.now()}`,
      phone,
      name: name || (assignedRole === 'ORGANIZATION' ? 'New Business' : assignedRole === 'CELEBRITY' ? 'New Celebrity' : 'Friend User'),
      role: assignedRole,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${phone}`,
      isVerified: assignedRole === 'NORMAL',
      isPremium: false,
      walletBalance: assignedRole === 'NORMAL' ? 100 : 0,
      isBlocked: false,
      createdAt: new Date().toISOString()
    };

    if (assignedRole === 'CELEBRITY') {
      user.celebrityProfile = {
        title: 'Creator & Artist',
        category: 'Entertainment',
        bio: 'Welcome to my space. Connect on voice & video.',
        photos: [],
        videos: [],
        audioRatePerMin: 100,
        videoRatePerMin: 250,
        isOnlineForCalls: true,
        rating: 5.0,
        totalCalls: 0
      };
    } else if (assignedRole === 'ORGANIZATION') {
      user.orgProfile = {
        companyName: user.name,
        verifiedStatus: 'PENDING'
      };
    }

    db.users.set(user.id, user);
  }

  if (user.isBlocked) {
    res.status(403).json({ success: false, message: 'Your account has been suspended by Admin' });
    return;
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  // Clear OTP
  db.activeOtps.delete(phone);

  res.json({
    success: true,
    message: 'Authentication successful',
    token,
    user
  });
});

// Get Current User Profile
router.get('/me', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.users.get(decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Update Profile
router.put('/profile', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.users.get(decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { name, avatarUrl, location, isPremium, celebrityProfile } = req.body;
    if (name) user.name = name;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (location) user.location = location;
    if (isPremium !== undefined) user.isPremium = isPremium;
    if (celebrityProfile && user.role === 'CELEBRITY') {
      user.celebrityProfile = { ...user.celebrityProfile!, ...celebrityProfile };
    }

    db.users.set(user.id, user);
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;
