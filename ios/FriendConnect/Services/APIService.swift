import Foundation

class APIService {
    static let shared = APIService()
    // Local development endpoint (localhost for iOS Simulator)
    private let baseURL = "http://localhost:4000/api"

    private init() {}

    func sendOtp(phone: String) async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/auth/send-otp") else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = ["phone": phone]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        if let httpRes = response as? HTTPURLResponse {
            return httpRes.statusCode == 200
        }
        return false
    }

    func verifyOtp(phone: String, otp: String, role: String) async throws -> User? {
        guard let url = URL(string: "\(baseURL)/auth/verify-otp") else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = ["phone": phone, "otp": otp, "role": role]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        if let httpRes = response as? HTTPURLResponse, httpRes.statusCode == 200 {
            struct VerifyResponse: Codable {
                let success: Bool
                let user: User
            }
            let res = try JSONDecoder().decode(VerifyResponse.self, from: data)
            return res.user
        }
        return nil
    }

    func fetchNearbyEvents(lat: Double = 9.9312, lng: Double = 76.2673, radius: Int = 50) async throws -> [EventItem] {
        guard let url = URL(string: "\(baseURL)/events?lat=\(lat)&lng=\(lng)&radius=\(radius)") else {
            return []
        }
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode(EventsResponse.self, from: data)
        return response.events
    }

    func bookTicket(eventId: String, userId: String, quantity: Int = 1) async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/events/\(eventId)/book") else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = ["userId": userId, "quantity": quantity] as [String : Any]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        if let httpRes = response as? HTTPURLResponse {
            return httpRes.statusCode == 200 || httpRes.statusCode == 201
        }
        return false
    }

    func fetchCelebrities() async throws -> [User] {
        guard let url = URL(string: "\(baseURL)/celebrities") else { return [] }
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode(CelebritiesResponse.self, from: data)
        return response.celebrities
    }

    func requestCelebrityCall(celebrityId: String, userId: String, callType: String = "CELEBRITY_AUDIO") async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/celebrities/\(celebrityId)/request-call") else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = ["userId": userId, "callType": callType]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        if let httpRes = response as? HTTPURLResponse {
            return httpRes.statusCode == 200
        }
        return false
    }

    func requestSupportCall(userId: String) async throws -> Bool {
        guard let url = URL(string: "\(baseURL)/support/call/request") else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let payload = ["userId": userId]
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        if let httpRes = response as? HTTPURLResponse {
            return httpRes.statusCode == 200
        }
        return false
    }
}
