export type UserRole = 'NORMAL' | 'CELEBRITY' | 'ORGANIZATION' | 'SUPPORT_AGENT' | 'SUPER_ADMIN';

export type CallType = 'RANDOM_AUDIO' | 'CELEBRITY_AUDIO' | 'CELEBRITY_VIDEO' | 'SUPPORT_CALL';

export type CallStatus = 'WAITING' | 'RINGING' | 'CONNECTED' | 'REJECTED' | 'ENDED' | 'MISSED';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface CelebrityProfile {
  title: string;
  category: string;
  bio: string;
  photos: string[];
  videos: string[];
  audioRatePerMin: number;
  videoRatePerMin: number;
  isOnlineForCalls: boolean;
  rating: number;
  totalCalls: number;
}

export interface OrgProfile {
  companyName: string;
  registrationNumber?: string;
  website?: string;
  verifiedStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  location?: GeoLocation;
  isVerified: boolean;
  isPremium: boolean;
  walletBalance: number;
  celebrityProfile?: CelebrityProfile;
  orgProfile?: OrgProfile;
  isBlocked: boolean;
  createdAt: string;
}

export interface EventItem {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  location: GeoLocation;
  dateTime: string;
  bannerUrl: string;
  ticketPrice: number;
  totalTickets: number;
  bookedTickets: number;
  createdAt: string;
}

export interface TicketBooking {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userPhone: string;
  quantity: number;
  totalPrice: number;
  qrCodeToken: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
  bookedAt: string;
}

export interface CallSession {
  id: string;
  type: CallType;
  callerId: string;
  calleeId?: string;
  callerSocketId?: string;
  calleeSocketId?: string;
  roomName: string;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  cost?: number;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: UserRole;
  assignedAgentId?: string;
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}
