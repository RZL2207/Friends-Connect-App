package com.friendconnect.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friendconnect.app.data.api.ApiService
import com.friendconnect.app.data.model.User
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(
    onLoginSuccess: (User) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val apiService = remember { ApiService.create() }

    var phone by remember { mutableStateOf("9876543214") }
    var otp by remember { mutableStateOf("123456") }
    var selectedRole by remember { mutableStateOf("NORMAL") }
    var isOtpSent by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Icon
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(Color(0xFF4F46E5), RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Bolt,
                        contentDescription = "Logo",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Sign In to FriendConnect",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Text(
                    text = "Mobile OTP Authentication",
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(24.dp))

                if (!isOtpSent) {
                    // Mobile Number Input
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number") },
                        leadingIcon = {
                            Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF64748B))
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF4F46E5),
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedContainerColor = Color(0xFF090D16),
                            unfocusedContainerColor = Color(0xFF090D16)
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                isLoading = true
                                errorMessage = null
                                try {
                                    val formattedPhone = if (phone.startsWith("+")) phone else "+91$phone"
                                    val res = apiService.sendOtp(mapOf("phone" to formattedPhone))
                                    if (res.isSuccessful) {
                                        isOtpSent = true
                                    } else {
                                        errorMessage = "Failed to send OTP"
                                    }
                                } catch (e: Exception) {
                                    errorMessage = "Network error: ${e.message}"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        enabled = !isLoading && phone.isNotBlank(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5))
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                        } else {
                            Text("Send OTP", fontWeight = FontWeight.SemiBold)
                        }
                    }
                } else {
                    // OTP Verification Step
                    Text(
                        text = "Enter 6-digit code sent to +91 $phone",
                        fontSize = 12.sp,
                        color = Color(0xFF94A3B8),
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = otp,
                        onValueChange = { if (it.length <= 6) otp = it },
                        label = { Text("6-Digit OTP") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF10B981),
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedContainerColor = Color(0xFF090D16),
                            unfocusedContainerColor = Color(0xFF090D16)
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            coroutineScope.launch {
                                isLoading = true
                                errorMessage = null
                                try {
                                    val formattedPhone = if (phone.startsWith("+")) phone else "+91$phone"
                                    val res = apiService.verifyOtp(mapOf(
                                        "phone" to formattedPhone,
                                        "otp" to otp,
                                        "role" to selectedRole
                                    ))
                                    if (res.isSuccessful && res.body() != null) {
                                        val body = res.body()!!
                                        val userMap = body["user"] as? Map<String, Any>
                                        if (userMap != null) {
                                            val loggedInUser = User(
                                                id = userMap["id"] as? String ?: "usr_normal_1",
                                                phone = userMap["phone"] as? String ?: formattedPhone,
                                                name = userMap["name"] as? String ?: "User",
                                                role = userMap["role"] as? String ?: "NORMAL",
                                                avatarUrl = userMap["avatarUrl"] as? String ?: "",
                                                isVerified = userMap["isVerified"] as? Boolean ?: true,
                                                isPremium = userMap["isPremium"] as? Boolean ?: false,
                                                walletBalance = (userMap["walletBalance"] as? Number)?.toDouble() ?: 0.0
                                            )
                                            onLoginSuccess(loggedInUser)
                                        }
                                    } else {
                                        errorMessage = "Invalid OTP"
                                    }
                                } catch (e: Exception) {
                                    errorMessage = "Error: ${e.message}"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        enabled = !isLoading && otp.length >= 4,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                        } else {
                            Row(verticalAlignment = Alignment.CenterVertizontally) {
                                Icon(Icons.Default.LockOpen, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Verify & Enter", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    TextButton(onClick = { isOtpSent = false }) {
                        Text("Change phone number", fontSize = 12.sp, color = Color(0xFF94A3B8))
                    }
                }

                if (errorMessage != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = errorMessage!!,
                        fontSize = 12.sp,
                        color = Color(0xFFEF4444),
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Fast test login button
                OutlinedButton(
                    onClick = {
                        val sampleUser = User(
                            id = "usr_normal_1",
                            phone = "+919876543214",
                            name = "Rahul Kumar",
                            role = "NORMAL",
                            avatarUrl = "",
                            isVerified = true,
                            isPremium = true,
                            walletBalance = 1200.0
                        )
                        onLoginSuccess(sampleUser)
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFA5B4FC))
                ) {
                    Text("Fast Demo Login (Rahul)", fontSize = 12.sp)
                }
            }
        }
    }
}
