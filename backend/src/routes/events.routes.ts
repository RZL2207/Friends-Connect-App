import { Router, Request, Response } from 'express';
import { db } from '../store';
import { EventItem, TicketBooking } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List events with optional Geo-Proximity Filter (Lat, Lng, Radius in KM)
router.get('/', (req: Request, res: Response): void => {
  const { lat, lng, radius, category, search } = req.query;

  let allEvents = Array.from(db.events.values());

  // Proximity filter
  if (lat && lng) {
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const maxRadius = radius ? parseFloat(radius as string) : 50; // default 50km

    allEvents = allEvents
      .map(event => {
        const distanceKm = db.calculateDistanceKm(
          userLat,
          userLng,
          event.location.latitude,
          event.location.longitude
        );
        return { ...event, distanceKm: Math.round(distanceKm * 10) / 10 };
      })
      .filter(event => event.distanceKm <= maxRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // Category filter
  if (category) {
    allEvents = allEvents.filter(e => e.category.toLowerCase() === (category as string).toLowerCase());
  }

  // Text search
  if (search) {
    const query = (search as string).toLowerCase();
    allEvents = allEvents.filter(e =>
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.venue.toLowerCase().includes(query)
    );
  }

  res.json({ success: true, count: allEvents.length, events: allEvents });
});

// Get single event
router.get('/:id', (req: Request, res: Response): void => {
  const eventId = req.params.id as string;
  const event = db.events.get(eventId);
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }
  res.json({ success: true, event });
});

// Create Event (Organization accounts only)
router.post('/', (req: Request, res: Response): void => {
  const {
    orgId,
    title,
    description,
    category,
    venue,
    latitude,
    longitude,
    city,
    dateTime,
    bannerUrl,
    ticketPrice,
    totalTickets
  } = req.body;

  if (!title || !venue || !ticketPrice || !dateTime) {
    res.status(400).json({ success: false, message: 'Missing required event fields' });
    return;
  }

  const orgUser = orgId ? db.users.get(orgId) : null;

  const newEvent: EventItem = {
    id: `evt_${Date.now()}`,
    orgId: orgId || 'usr_org_1',
    orgName: orgUser ? orgUser.name : 'Verified Organization',
    title,
    description: description || '',
    category: category || 'General',
    venue,
    location: {
      latitude: parseFloat(latitude) || 9.9312,
      longitude: parseFloat(longitude) || 76.2673,
      city: city || 'Kochi'
    },
    dateTime,
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1000',
    ticketPrice: parseFloat(ticketPrice),
    totalTickets: parseInt(totalTickets) || 500,
    bookedTickets: 0,
    createdAt: new Date().toISOString()
  };

  db.events.set(newEvent.id, newEvent);
  res.status(201).json({ success: true, message: 'Event published successfully', event: newEvent });
});

// Book Event Ticket
router.post('/:id/book', (req: Request, res: Response): void => {
  const eventId = req.params.id as string;
  const event = db.events.get(eventId);
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' });
    return;
  }

  const { userId, quantity = 1 } = req.body;
  const user = db.users.get(userId);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const requestedQty = parseInt(quantity as string);
  if (event.bookedTickets + requestedQty > event.totalTickets) {
    res.status(400).json({ success: false, message: 'Sold out or insufficient tickets available' });
    return;
  }

  const totalPrice = event.ticketPrice * requestedQty;

  const booking: TicketBooking = {
    id: `tkt_${Date.now()}`,
    eventId: event.id,
    eventTitle: event.title,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    quantity: requestedQty,
    totalPrice,
    qrCodeToken: `QR-${uuidv4().substring(0, 8).toUpperCase()}`,
    status: 'CONFIRMED',
    bookedAt: new Date().toISOString()
  };

  // Update booked count
  event.bookedTickets += requestedQty;
  db.events.set(event.id, event);
  db.tickets.set(booking.id, booking);

  res.status(201).json({
    success: true,
    message: 'Tickets booked successfully',
    booking
  });
});

// User's booked tickets
router.get('/user/:userId/tickets', (req: Request, res: Response): void => {
  const userTickets = Array.from(db.tickets.values()).filter(t => t.userId === req.params.userId);
  res.json({ success: true, count: userTickets.length, tickets: userTickets });
});

// Check-in Ticket via QR scanner (For Organization scan app)
router.post('/tickets/check-in', (req: Request, res: Response): void => {
  const { qrCodeToken } = req.body;
  if (!qrCodeToken) {
    res.status(400).json({ success: false, message: 'QR Code is required' });
    return;
  }

  const ticket = Array.from(db.tickets.values()).find(t => t.qrCodeToken === qrCodeToken);
  if (!ticket) {
    res.status(404).json({ success: false, message: 'Invalid ticket QR token' });
    return;
  }

  if (ticket.status === 'CHECKED_IN') {
    res.status(400).json({
      success: false,
      message: 'Ticket already checked in previously',
      ticket
    });
    return;
  }

  ticket.status = 'CHECKED_IN';
  db.tickets.set(ticket.id, ticket);

  res.json({
    success: true,
    message: 'Ticket validated successfully! Welcome to the event.',
    ticket
  });
});

export default router;
