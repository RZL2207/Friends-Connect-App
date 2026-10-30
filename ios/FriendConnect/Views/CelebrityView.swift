import SwiftUI

struct CelebrityView: View {
    let userId: String
    @State private var celebrities: [User] = []
    @State private var isLoading = true

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.04, green: 0.05, blue: 0.09).ignoresSafeArea()

                if isLoading {
                    ProgressView().tint(Color.orange)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(celebrities) { celeb in
                                CelebrityCard(celeb: celeb) { type in
                                    Task {
                                        _ = try? await APIService.shared.requestCelebrityCall(
                                            celebrityId: celeb.id,
                                            userId: userId,
                                            callType: type
                                        )
                                    }
                                }
                            }
                        }
                        .padding(16)
                    }
                }
            }
            .navigationTitle("VIP Connect")
            .task {
                celebrities = (try? await APIService.shared.fetchCelebrities()) ?? []
                isLoading = false
            }
        }
    }
}

struct CelebrityCard: View {
    let celeb: User
    let onCall: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                Circle()
                    .fill(Color(red: 0.12, green: 0.16, blue: 0.24))
                    .frame(width: 48, height: 48)

                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(celeb.name)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }

                    Text(celeb.celebrityProfile?.title ?? "VIP Creator")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }

            Text(celeb.celebrityProfile?.bio ?? "")
                .font(.footnote)
                .foregroundColor(Color.gray)
                .lineLimit(2)

            HStack(spacing: 12) {
                Button(action: { onCall("CELEBRITY_AUDIO") }) {
                    HStack {
                        Image(systemName: "phone.fill")
                        Text("Audio (₹\(celeb.celebrityProfile?.audioRatePerMin ?? 100)/m)")
                    }
                    .font(.caption)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color(red: 0.12, green: 0.16, blue: 0.24))
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }

                Button(action: { onCall("CELEBRITY_VIDEO") }) {
                    HStack {
                        Image(systemName: "video.fill")
                        Text("Video (₹\(celeb.celebrityProfile?.videoRatePerMin ?? 250)/m)")
                    }
                    .font(.caption)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
            }
        }
        .padding(16)
        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
        .cornerRadius(16)
    }
}
