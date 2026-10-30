import SwiftUI

struct AuthView: View {
    @State private var phone: String = "9876543214"
    @State private var otp: String = "123456"
    @State private var selectedRole: String = "NORMAL"
    @State private var isOtpSent: Bool = false
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil

    let onLoginSuccess: (User) -> Void

    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.05, blue: 0.09).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    Spacer().frame(height: 40)

                    // Logo Icon
                    ZStack {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .frame(width: 64, height: 64)

                        Image(systemName: "bolt.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.white)
                    }

                    VStack(spacing: 6) {
                        Text("Sign In to FriendConnect")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)

                        Text("Enter your phone number to receive OTP")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }

                    // Card Container
                    VStack(spacing: 18) {
                        if !isOtpSent {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Mobile Phone Number")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)

                                HStack(spacing: 10) {
                                    Text("+91")
                                        .font(.subheadline)
                                        .foregroundColor(.gray)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 14)
                                        .background(Color(red: 0.12, green: 0.16, blue: 0.24))
                                        .cornerRadius(12)

                                    TextField("98765 43214", text: $phone)
                                        .keyboardType(.phonePad)
                                        .padding(14)
                                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                                        .foregroundColor(.white)
                                        .cornerRadius(12)
                                }
                            }

                            Button(action: sendOtp) {
                                HStack {
                                    if isLoading {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Send OTP")
                                            .fontWeight(.semibold)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                                .foregroundColor(.white)
                                .cornerRadius(14)
                            }
                            .disabled(isLoading || phone.isEmpty)
                        } else {
                            VStack(spacing: 12) {
                                Text("Enter 6-digit code sent to +91 \(phone)")
                                    .font(.caption)
                                    .foregroundColor(.gray)

                                TextField("123456", text: $otp)
                                    .keyboardType(.numberPad)
                                    .multilineTextAlignment(.center)
                                    .font(.system(size: 24, weight: .bold))
                                    .padding(14)
                                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                                    .foregroundColor(.white)
                                    .cornerRadius(12)

                                Text("Demo OTP: 123456")
                                    .font(.caption2)
                                    .foregroundColor(.green)

                                Button(action: verifyOtp) {
                                    HStack {
                                        if isLoading {
                                            ProgressView().tint(.white)
                                        } else {
                                            Image(systemName: "lock.open.fill")
                                            Text("Verify & Enter")
                                                .fontWeight(.semibold)
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(14)
                                }
                                .disabled(isLoading || otp.count < 4)

                                Button("Change number") {
                                    isOtpSent = false
                                }
                                .font(.caption)
                                .foregroundColor(.gray)
                            }
                        }

                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                        }

                        Divider().background(Color.gray.opacity(0.3))

                        // Fast Test Login
                        Button(action: fastDemoLogin) {
                            Text("Fast Demo Login (Rahul)")
                                .font(.caption)
                                .fontWeight(.medium)
                                .padding(.vertical, 10)
                                .frame(maxWidth: .infinity)
                                .background(Color(red: 0.12, green: 0.16, blue: 0.24))
                                .foregroundColor(Color(red: 0.65, green: 0.71, blue: 0.99))
                                .cornerRadius(10)
                        }
                    }
                    .padding(20)
                    .background(Color(red: 0.09, green: 0.11, blue: 0.18))
                    .cornerRadius(20)
                    .padding(.horizontal, 20)
                }
            }
        }
    }

    private func sendOtp() {
        isLoading = true
        errorMessage = nil
        Task {
            let formattedPhone = phone.hasPrefix("+") ? phone : "+91\(phone)"
            let success = (try? await APIService.shared.sendOtp(phone: formattedPhone)) ?? false
            await MainActor.run {
                isLoading = false
                if success {
                    isOtpSent = true
                } else {
                    errorMessage = "Failed to send OTP"
                }
            }
        }
    }

    private func verifyOtp() {
        isLoading = true
        errorMessage = nil
        Task {
            let formattedPhone = phone.hasPrefix("+") ? phone : "+91\(phone)"
            let user = try? await APIService.shared.verifyOtp(phone: formattedPhone, otp: otp, role: selectedRole)
            await MainActor.run {
                isLoading = false
                if let user = user {
                    onLoginSuccess(user)
                } else {
                    errorMessage = "Invalid verification code"
                }
            }
        }
    }

    private func fastDemoLogin() {
        let demoUser = User(
            id: "usr_normal_1",
            phone: "+919876543214",
            name: "Rahul Kumar",
            role: "NORMAL",
            avatarUrl: "",
            isVerified: true,
            isPremium: true,
            walletBalance: 1200,
            celebrityProfile: nil
        )
        onLoginSuccess(demoUser)
    }
}
