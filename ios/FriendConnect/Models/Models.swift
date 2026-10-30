import Foundation

struct GeoLocation: Codable {
    let latitude: Double
    let longitude: Double
    let city: String?
}

struct CelebrityProfile: Codable {
    let title: String
    let category: String
    let bio: String
    let audioRatePerMin: Int
    let videoRatePerMin: Int
    let isOnlineForCalls: Bool
    let rating: Double
}

struct User: Identifiable, Codable {
    let id: String
    let phone: String
    let name: String
    let role: String
    let avatarUrl: String
    let isVerified: Bool
    let isPremium: Bool
    let walletBalance: Double
    let celebrityProfile: CelebrityProfile?
}

struct EventItem: Identifiable, Codable {
    let id: String
    let orgId: String
    let orgName: String
    let title: String
    let description: String
    let category: String
    let venue: String
    let location: GeoLocation
    let dateTime: String
    let bannerUrl: String
    let ticketPrice: Double
    let totalTickets: Int
    let bookedTickets: Int
    let distanceKm: Double?
}

struct EventsResponse: Codable {
    let success: BooleanLiteralType
    let count: Int
    let events: [EventItem]
}

struct CelebritiesResponse: Codable {
    let success: Bool
    let count: Int
    let celebrities: [User]
}

struct CallSession: Codable {
    let id: String
    let type: String
    let callerId: String
    let calleeId: String?
    let roomName: String
    let status: String
}

struct SupportTicket: Codable {
    let id: String
    let userId: String
    let status: String
    let messages: [SupportMessage]
}

struct SupportMessage: Identifiable, Codable {
    let id: String
    let senderId: String
    let senderName: String
    let text: String
    let createdAt: String
}
