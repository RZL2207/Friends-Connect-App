import { User, EventItem, TicketBooking, CallSession, SupportTicket } from '../types';

class DataStore {
  public users: Map<string, User> = new Map();
  public events: Map<string, EventItem> = new Map();
  public tickets: Map<string, TicketBooking> = new Map();
  public callSessions: Map<string, CallSession> = new Map();
  public supportTickets: Map<string, SupportTicket> = new Map();
  public activeOtps: Map<string, { otp: string; expiresAt: number }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Super Admin
    const admin: User = {
      id: 'usr_admin_1',
      phone: '+919876543210',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isVerified: true,
      isPremium: true,
      walletBalance: 100000,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    this.users.set(admin.id, admin);

    // 2. Customer Support Agent
    const agent: User = {
      id: 'usr_support_1',
      phone: '+919876543211',
      name: 'Sarah - Customer Care',
      role: 'SUPPORT_AGENT',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isVerified: true,
      isPremium: false,
      walletBalance: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    this.users.set(agent.id, agent);

    // 3. Celebrity User
    const celeb1: User = {
      id: 'usr_celeb_1',
      phone: '+919876543212',
      name: 'Dulquer Salmaan (Verified)',
      role: 'CELEBRITY',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isVerified: true,
      isPremium: true,
      walletBalance: 25000,
      isBlocked: false,
      celebrityProfile: {
        title: 'Actor & Producer',
        category: 'Cinema & Arts',
        bio: 'Connecting with fans on exclusive voice & video sessions. Let us talk movies!',
        photos: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800'
        ],
        videos: [
          'https://assets.mixkit.co/videos/preview/mixkit-young-man-waving-at-the-camera-42867-large.mp4'
        ],
        audioRatePerMin: 150, // INR per min
        videoRatePerMin: 300,
        isOnlineForCalls: true,
        rating: 4.9,
        totalCalls: 342
      },
      createdAt: new Date().toISOString(),
    };
    this.users.set(celeb1.id, celeb1);

    // 4. Organization User
    const org1: User = {
      id: 'usr_org_1',
      phone: '+919876543213',
      name: 'Kochi Music & Cultural Fest Ltd',
      role: 'ORGANIZATION',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
      isVerified: true,
      isPremium: true,
      walletBalance: 85000,
      isBlocked: false,
      orgProfile: {
        companyName: 'Kochi Music & Cultural Fest Ltd',
        registrationNumber: 'KL-ERN-2024-9981',
        website: 'https://kochieventsexpo.com',
        verifiedStatus: 'APPROVED'
      },
      createdAt: new Date().toISOString(),
    };
    this.users.set(org1.id, org1);

    // 5. Normal Users (for random matchmaking & events)
    const normalUser1: User = {
      id: 'usr_normal_1',
      phone: '+919876543214',
      name: 'Rahul Kumar',
      role: 'NORMAL',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      location: { latitude: 9.9312, longitude: 76.2673, city: 'Kochi', country: 'India' },
      isVerified: true,
      isPremium: true,
      walletBalance: 1200,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    this.users.set(normalUser1.id, normalUser1);

    const normalUser2: User = {
      id: 'usr_normal_2',
      phone: '+919876543215',
      name: 'Anjali Menon',
      role: 'NORMAL',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      location: { latitude: 9.9674, longitude: 76.2454, city: 'Kochi', country: 'India' },
      isVerified: true,
      isPremium: false,
      walletBalance: 50,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    this.users.set(normalUser2.id, normalUser2);

    // Seed Events
    const event1: EventItem = {
      id: 'evt_101',
      orgId: org1.id,
      orgName: org1.name,
      title: 'Grand Coastal Indie Music Festival 2026',
      description: 'Experience an electrifying night of live indie bands, live food trucks, and acoustic sunset sessions right at Marine Drive Kochi.',
      category: 'Music & Concerts',
      venue: 'Marine Drive Waterfront, Kochi',
      location: { latitude: 9.9816, longitude: 76.2764, city: 'Kochi', country: 'India' },
      dateTime: '2026-11-15T18:00:00Z',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000',
      ticketPrice: 499,
      totalTickets: 1500,
      bookedTickets: 312,
      createdAt: new Date().toISOString()
    };
    this.events.set(event1.id, event1);

    const event2: EventItem = {
      id: 'evt_102',
      orgId: org1.id,
      orgName: org1.name,
      title: 'Kerala Tech Innovators Summit 2026',
      description: 'Annual gathering of AI builders, mobile founders, and venture leaders featuring talks, pitch competitions, and VIP mixers.',
      category: 'Technology & Business',
      venue: 'Lulu Cyber Tower, Infopark Kochi',
      location: { latitude: 10.0159, longitude: 76.3638, city: 'Kochi', country: 'India' },
      dateTime: '2026-12-05T09:30:00Z',
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000',
      ticketPrice: 899,
      totalTickets: 500,
      bookedTickets: 180,
      createdAt: new Date().toISOString()
    };
    this.events.set(event2.id, event2);
  }

  // Calculate distance between two coordinates in kilometers using Haversine Formula
  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const db = new DataStore();
