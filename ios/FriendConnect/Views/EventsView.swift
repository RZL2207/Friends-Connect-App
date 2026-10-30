import SwiftUI

struct EventsView: View {
    let userId: String
    @State private var events: [EventItem] = []
    @State private var isLoading = true
    @State private var selectedRadius = 50

    var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.04, green: 0.05, blue: 0.09).ignoresSafeArea()

                if isLoading {
                    ProgressView().tint(Color(red: 0.31, green: 0.27, blue: 0.90))
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(events) { event in
                                EventRow(event: event) {
                                    Task {
                                        _ = try? await APIService.shared.bookTicket(eventId: event.id, userId: userId)
                                    }
                                }
                            }
                        }
                        .padding(16)
                    }
                }
            }
            .navigationTitle("Nearby Events")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Picker("Radius", selection: $selectedRadius) {
                        Text("15 km").tag(15)
                        Text("50 km").tag(50)
                        Text("100 km").tag(100)
                    }
                    .pickerStyle(MenuPickerStyle())
                }
            }
            .task {
                do {
                    events = try await APIService.shared.fetchNearbyEvents(radius: selectedRadius)
                } catch {}
                isLoading = false
            }
        }
    }
}

struct EventRow: View {
    let event: EventItem
    let onBook: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(event.category)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(Color.purple)
                Spacer()
                Text("\(Int(event.distanceKm ?? 0)) km away")
                    .font(.caption)
                    .foregroundColor(Color.gray)
            }

            Text(event.title)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.white)

            HStack {
                Image(systemName: "mappin.and.ellipse")
                    .foregroundColor(.gray)
                    .font(.caption)
                Text(event.venue)
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            Divider().background(Color.gray.opacity(0.3))

            HStack {
                VStack(alignment: .leading) {
                    Text("Pass")
                        .font(.caption2)
                        .foregroundColor(.gray)
                    Text("₹\(Int(event.ticketPrice))")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }

                Spacer()

                Button(action: onBook) {
                    Text("Book Ticket")
                        .font(.footnote)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
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
