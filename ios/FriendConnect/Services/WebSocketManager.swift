import Foundation

enum MatchState {
    case idle
    case searching
    case connected(roomId: String, peerName: String)
}

class WebSocketManager: ObservableObject {
    static let shared = WebSocketManager()
    private var webSocketTask: URLSessionWebSocketTask?
    
    @Published var matchState: MatchState = .idle
    @Published var isMuted: Bool = false

    private init() {}

    func connect() {
        guard let url = URL(string: "ws://localhost:4000/socket.io/?EIO=4&transport=websocket") else { return }
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        listenForMessages()
    }

    private func listenForMessages() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .failure(let error):
                print("WebSocket error: \(error)")
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleSocketMessage(text)
                default: break
                }
                self?.listenForMessages()
            }
        }
    }

    private func handleSocketMessage(_ text: String) {
        DispatchQueue.main.async {
            if text.contains("match_found") {
                self.matchState = .connected(roomId: "room_match_ios", peerName: "Anjali Menon")
            } else if text.contains("queue_waiting") {
                self.matchState = .searching
            } else if text.contains("call_ended") {
                self.matchState = .idle
            }
        }
    }

    func startMatchmaking(userId: String) {
        matchState = .searching
        // Send join queue payload
    }

    func cancelMatchmaking() {
        matchState = .idle
    }

    func endCall() {
        matchState = .idle
    }

    func toggleMute() {
        isMuted.toggle()
    }
}
