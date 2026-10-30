import { Router, Request, Response } from 'express';
import { db } from '../store';
import { SupportTicket, SupportMessage, CallSession } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get or Create Support Ticket for User
router.post('/ticket', (req: Request, res: Response): void => {
  const { userId } = req.body;
  const user = db.users.get(userId);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Check if open ticket exists
  let ticket = Array.from(db.supportTickets.values()).find(
    t => t.userId === userId && t.status !== 'RESOLVED'
  );

  if (!ticket) {
    ticket = {
      id: `sup_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      userRole: user.role,
      status: 'OPEN',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: 'SYSTEM',
          senderName: 'FriendConnect Support Desk',
          senderRole: 'SUPPORT_AGENT',
          text: `Hello ${user.name}! Welcome to Customer Support. An agent will assist you shortly. You can chat or request an instant audio call.`,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.supportTickets.set(ticket.id, ticket);
  }

  res.json({ success: true, ticket });
});

// Post Message in Support Ticket
router.post('/ticket/:id/message', (req: Request, res: Response): void => {
  const ticketId = req.params.id as string;
  const ticket = db.supportTickets.get(ticketId);
  if (!ticket) {
    res.status(404).json({ success: false, message: 'Support ticket not found' });
    return;
  }

  const { senderId, text } = req.body;
  const sender = db.users.get(senderId);

  if (!text) {
    res.status(400).json({ success: false, message: 'Message text is required' });
    return;
  }

  const newMessage: SupportMessage = {
    id: `msg_${Date.now()}`,
    senderId: sender ? sender.id : 'ANONYMOUS',
    senderName: sender ? sender.name : 'User',
    senderRole: sender ? sender.role : 'NORMAL',
    text,
    createdAt: new Date().toISOString()
  };

  ticket.messages.push(newMessage);
  ticket.updatedAt = new Date().toISOString();
  db.supportTickets.set(ticket.id, ticket);

  res.status(201).json({ success: true, message: newMessage, ticket });
});

// Request Live Voice Call to Support Agent
router.post('/call/request', (req: Request, res: Response): void => {
  const { userId } = req.body;
  const user = db.users.get(userId);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Find available support agent
  const agent = Array.from(db.users.values()).find(
    u => u.role === 'SUPPORT_AGENT' && !u.isBlocked
  );

  const sessionId = `call_sup_${Date.now()}`;
  const roomName = `room_support_${sessionId}`;

  const callSession: CallSession = {
    id: sessionId,
    type: 'SUPPORT_CALL',
    callerId: user.id,
    calleeId: agent ? agent.id : 'usr_support_1',
    roomName,
    status: 'RINGING',
    startedAt: new Date().toISOString(),
    cost: 0 // Support calls are free
  };

  db.callSessions.set(sessionId, callSession);

  res.json({
    success: true,
    message: 'Routing your audio call to customer care team...',
    callSession,
    agent: agent ? { id: agent.id, name: agent.name } : { name: 'Support Representative' }
  });
});

// Support Agent Queue (List all active tickets)
router.get('/agent/queue', (req: Request, res: Response): void => {
  const allTickets = Array.from(db.supportTickets.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const activeSupportCalls = Array.from(db.callSessions.values()).filter(
    c => c.type === 'SUPPORT_CALL' && (c.status === 'RINGING' || c.status === 'CONNECTED')
  );

  res.json({
    success: true,
    tickets: allTickets,
    activeVoiceCalls: activeSupportCalls
  });
});

export default router;
