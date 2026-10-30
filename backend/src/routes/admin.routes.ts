import { Router, Request, Response } from 'express';
import { db } from '../store';

const router = Router();

// Platform Overview Stats
router.get('/stats', (req: Request, res: Response): void => {
  const users = Array.from(db.users.values());
  const events = Array.from(db.events.values());
  const tickets = Array.from(db.tickets.values());
  const calls = Array.from(db.callSessions.values());

  const totalTicketRevenue = tickets.reduce((sum, t) => sum + t.totalPrice, 0);

  const stats = {
    totalUsers: users.length,
    userCountsByRole: {
      NORMAL: users.filter(u => u.role === 'NORMAL').length,
      CELEBRITY: users.filter(u => u.role === 'CELEBRITY').length,
      ORGANIZATION: users.filter(u => u.role === 'ORGANIZATION').length,
      SUPPORT_AGENT: users.filter(u => u.role === 'SUPPORT_AGENT').length,
      SUPER_ADMIN: users.filter(u => u.role === 'SUPER_ADMIN').length,
    },
    totalEvents: events.length,
    ticketsBooked: tickets.length,
    totalTicketRevenue,
    totalCallsLogged: calls.length,
    activeSupportTickets: Array.from(db.supportTickets.values()).filter(t => t.status !== 'RESOLVED').length
  };

  res.json({ success: true, stats });
});

// List Users with filtering & search
router.get('/users', (req: Request, res: Response): void => {
  const { role, search } = req.query;
  let users = Array.from(db.users.values());

  if (role) {
    users = users.filter(u => u.role === (role as string).toUpperCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    users = users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: users.length, users });
});

// Block or Unblock User
router.post('/users/:id/toggle-block', (req: Request, res: Response): void => {
  const userId = req.params.id as string;
  const user = db.users.get(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  user.isBlocked = !user.isBlocked;
  db.users.set(user.id, user);

  res.json({
    success: true,
    message: `User ${user.name} is now ${user.isBlocked ? 'BLOCKED' : 'ACTIVE'}`,
    user
  });
});

// Approve or Reject Organization Verification
router.post('/organizations/:id/verify', (req: Request, res: Response): void => {
  const { status } = req.body; // 'APPROVED' | 'REJECTED'
  const orgUserId = req.params.id as string;
  const user = db.users.get(orgUserId);

  if (!user || user.role !== 'ORGANIZATION' || !user.orgProfile) {
    res.status(404).json({ success: false, message: 'Organization account not found' });
    return;
  }

  user.orgProfile.verifiedStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  user.isVerified = status === 'APPROVED';
  db.users.set(user.id, user);

  res.json({
    success: true,
    message: `Organization verification status updated to ${status}`,
    user
  });
});

export default router;
