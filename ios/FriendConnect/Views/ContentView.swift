import SwiftUI

struct ContentView: View {
    @State private var currentUser: User? = nil
    @State private var selectedTab = 0

    init() {
        UITabBar.appearance().backgroundColor = UIColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0)
        UITabBar.appearance().unselectedItemTintColor = UIColor.gray
    }

    var body: some View {
        if let user = currentUser {
            VStack(spacing: 0) {
                // Top Mini Header with user & logout
                HStack {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                        Text("\(user.name) (\(user.role))")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    }
                    Spacer()
                    Button("Logout") {
                        currentUser = nil
                    }
                    .font(.caption)
                    .foregroundColor(.red)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))

                TabView(selection: $selectedTab) {
                    RandomMatchView(userId: user.id)
                        .tabItem {
                            Label("Match", systemImage: "phone.badge.plus")
                        }
                        .tag(0)

                    EventsView(userId: user.id)
                        .tabItem {
                            Label("Events", systemImage: "ticket.fill")
                        }
                        .tag(1)

                    CelebrityView(userId: user.id)
                        .tabItem {
                            Label("VIP", systemImage: "star.fill")
                        }
                        .tag(2)

                    SupportView(userId: user.id)
                        .tabItem {
                            Label("Support", systemImage: "headphones")
                        }
                        .tag(3)
                }
                .accentColor(Color(red: 0.31, green: 0.27, blue: 0.90))
            }
        } else {
            AuthView(onLoginSuccess: { user in
                self.currentUser = user
            })
        }
    }
}
