import SwiftUI

struct RandomMatchView: View {
    @ObservedObject var socketManager = WebSocketManager.shared
    @State private var isAnimatingRadar = false
    let userId: String

    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.05, blue: 0.09).ignoresSafeArea()

            switch socketManager.matchState {
            case .idle:
                VStack(spacing: 20) {
                    Spacer()

                    VStack(spacing: 8) {
                        Text("Random Audio Call")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(.white)
                        Text("Instant 1-on-1 conversations with random friends.")
                            .font(.system(size: 14))
                            .foregroundColor(Color.gray)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }

                    Spacer()

                    Button(action: {
                        socketManager.startMatchmaking(userId: userId)
                    }) {
                        HStack {
                            Image(systemName: "phone.fill")
                            Text("Find a Friend")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                        .foregroundColor(.white)
                        .cornerRadius(16)
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 32)
                }

            case .searching:
                VStack(spacing: 24) {
                    ZStack {
                        Circle()
                            .fill(Color(red: 0.31, green: 0.27, blue: 0.90).opacity(0.2))
                            .frame(width: isAnimatingRadar ? 180 : 90, height: isAnimatingRadar ? 180 : 90)
                            .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: isAnimatingRadar)

                        Circle()
                            .fill(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .frame(width: 90, height: 90)

                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                    }
                    .onAppear { isAnimatingRadar = true }

                    VStack(spacing: 6) {
                        Text("Searching for a friend...")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                        Text("Matching with someone online")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                    }

                    Button("Cancel") {
                        socketManager.cancelMatchmaking()
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(Color(red: 0.12, green: 0.16, blue: 0.24))
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }

            case .connected(_, let peerName):
                VStack(spacing: 24) {
                    Spacer()

                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [Color.green, Color.mint], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 100, height: 100)

                        Image(systemName: "person.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.white)
                    }

                    VStack(spacing: 6) {
                        Text(peerName)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                        Text("In Audio Call (Live)")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.green)
                    }

                    Spacer()

                    HStack(spacing: 24) {
                        Button(action: { socketManager.toggleMute() }) {
                            Image(systemName: socketManager.isMuted ? "mic.slash.fill" : "mic.fill")
                                .font(.system(size: 20))
                                .frame(width: 56, height: 56)
                                .background(socketManager.isMuted ? Color.red : Color(red: 0.12, green: 0.16, blue: 0.24))
                                .foregroundColor(.white)
                                .clipShape(Circle())
                        }

                        Button(action: { socketManager.endCall() }) {
                            Image(systemName: "phone.down.fill")
                                .font(.system(size: 26))
                                .frame(width: 68, height: 68)
                                .background(Color.red)
                                .foregroundColor(.white)
                                .clipShape(Circle())
                        }

                        Button(action: {
                            socketManager.endCall()
                            socketManager.startMatchmaking(userId: userId)
                        }) {
                            Image(systemName: "forward.fill")
                                .font(.system(size: 20))
                                .frame(width: 56, height: 56)
                                .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                                .foregroundColor(.white)
                                .clipShape(Circle())
                        }
                    }
                    .padding(.bottom, 48)
                }
            }
        }
    }
}
