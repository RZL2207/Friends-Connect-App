import SwiftUI

@main
struct FriendConnectApp: App {

    init() {
        // Connect WebSocket signaling on launch
        WebSocketManager.shared.connect()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
