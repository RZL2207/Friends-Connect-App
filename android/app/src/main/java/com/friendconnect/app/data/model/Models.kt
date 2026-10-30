package com.friendconnect.app.data.model

data class GeoLocation(
    val latitude: Double,
    val longitude: Double,
    val city: String? = null
)

data class CelebrityProfile(
    val title: String,
    val category: String,
    val bio: String,
    val audioRatePerMin: Int,
    val videoRatePerMin: Int,
    val isOnlineForCalls: Boolean,
    val rating: Double
)

data class User(
    val id: String,
    val phone: String,
    val name: String,
    val role: String,
    val avatarUrl: String,
    val isVerified: Boolean,
    val isPremium: Boolean,
    val walletBalance: Double,
    val celebrityProfile: CelebrityProfile? = null
)

data class EventItem(
    val id: String,
    val orgId: String,
    val orgName: String,
    val title: String,
    val description: String,
    val category: String,
    val venue: String,
    val location: GeoLocation,
    val dateTime: String,
    val bannerUrl: String,
    val ticketPrice: Double,
    val totalTickets: Int,
    val bookedTickets: Int,
    val distanceKm: Double? = null
)

data class EventsResponse(
    val success: Boolean,
    val count: Int,
    val events: List<EventItem>
)

data class CelebritiesResponse(
    val success: Boolean,
    val count: Int,
    val celebrities: List<User>
)

data class CallSession(
    val id: String,
    val type: String,
    val callerId: String,
    val calleeId: String?,
    val roomName: String,
    val status: String
)

data class CallResponse(
    val success: Boolean,
    val message: String,
    val callSession: CallSession
)

data class SupportTicketResponse(
    val success: Boolean,
    val ticket: SupportTicket
)

data class SupportTicket(
    val id: String,
    val userId: String,
    val status: String,
    val messages: List<SupportMessage>
)

data class SupportMessage(
    val id: String,
    val senderId: String,
    val senderName: String,
    val text: String,
    val createdAt: String
)
