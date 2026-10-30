import SwiftUI

struct SupportView: View {
    let userId: String
    @State private var messageText: String = ""
    @State private var messages: [SupportMessage] = [
        SupportMessage(
            id: "1",
            senderId: "SYSTEM",
            senderName: "Support Desk",
            text: "Welcome to FriendConnect Support! You can text us here or tap the phone icon to start an in-app audio call.",
            createdAt: ""
        )
    ]

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.04, green: 0.05, blue: 0.09).ignoresSafeArea()

                VStack {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(messages) { msg in
                                let isMe = msg.senderId == userId
                                HStack {
                                    if isMe { Spacer() }
                                    VStack(alignment: isMe ? .trailing : .leading, spacing: 4) {
                                        Text(msg.senderName)
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text(msg.text)
                                            .font(.subheadline)
                                            .foregroundColor(.white)
                                            .padding(12)
                                            .background(isMe ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.24))
                                            .cornerRadius(14)
                                    }
                                    if !isMe { Spacer() }
                                }
                            }
                        }
                        .padding(16)
                    }

                    HStack(spacing: 10) {
                        TextField("Type your query...", text: $messageText)
                            .padding(12)
                            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                            .foregroundColor(.white)
                            .cornerRadius(12)

                        Button(action: sendMessage) {
                            Image(systemName: "paperplane.fill")
                                .padding(12)
                                .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(16)
                }
            }
            .navigationTitle("Customer Care")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: callSupport) {
                        Image(systemName: "headphones")
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .clipShape(Circle())
                    }
                }
            }
        }
    }

    private func sendMessage() {
        guard !messageText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let newMsg = SupportMessage(
            id: UUID().uuidString,
            senderId: userId,
            senderName: "Me",
            text: messageText,
            createdAt: ""
        )
        messages.append(newMsg)
        messageText = ""
    }

    private func callSupport() {
        // Trigger CallKit outgoing call
        CallKitManager.shared.startCall(handle: "Customer Support Desk")
        Task {
            _ = try? await APIService.shared.requestSupportCall(userId: userId)
        }
    }
}
