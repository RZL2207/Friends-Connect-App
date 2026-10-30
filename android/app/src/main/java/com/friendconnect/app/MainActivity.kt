package com.friendconnect.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.friendconnect.app.service.CallManager
import com.friendconnect.app.ui.screens.*

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Realtime Calling Socket
        CallManager.initSocket()

        setContent {
            FriendConnectApp()
        }
    }
}

enum class ScreenTab(val title: String) {
    RANDOM_MATCH("Match"),
    EVENTS("Events"),
    CELEBRITIES("VIP"),
    SUPPORT("Support")
}

@Composable
fun FriendConnectApp() {
    var currentUser by remember { mutableStateOf<com.friendconnect.app.data.model.User?>(null) }
    var currentTab by remember { mutableStateOf(ScreenTab.RANDOM_MATCH) }

    if (currentUser == null) {
        AuthScreen(onLoginSuccess = { user ->
            currentUser = user
        })
    } else {
        val user = currentUser!!
        Scaffold(
            topBar = {
                SmallTopAppBar(
                    title = {
                        Text(
                            text = "${user.name} (${user.role})",
                            fontSize = 14.sp,
                            color = Color.White
                        )
                    },
                    actions = {
                        IconButton(onClick = { currentUser = null }) {
                            Icon(
                                Icons.Default.ExitToApp,
                                contentDescription = "Logout",
                                tint = Color(0xFFEF4444)
                            )
                        }
                    },
                    colors = TopAppBarDefaults.smallTopAppBarColors(
                        containerColor = Color(0xFF0F172A)
                    )
                )
            },
            bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF0F172A),
                contentColor = Color.White
            ) {
                NavigationBarItem(
                    selected = currentTab == ScreenTab.RANDOM_MATCH,
                    onClick = { currentTab = ScreenTab.RANDOM_MATCH },
                    icon = { Icon(Icons.Default.PhoneInTalk, contentDescription = "Random Call") },
                    label = { Text("Match") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        indicatorColor = Color(0xFF4F46E5)
                    )
                )

                NavigationBarItem(
                    selected = currentTab == ScreenTab.EVENTS,
                    onClick = { currentTab = ScreenTab.EVENTS },
                    icon = { Icon(Icons.Default.ConfirmationNumber, contentDescription = "Events") },
                    label = { Text("Events") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        indicatorColor = Color(0xFF4F46E5)
                    )
                )

                NavigationBarItem(
                    selected = currentTab == ScreenTab.CELEBRITIES,
                    onClick = { currentTab = ScreenTab.CELEBRITIES },
                    icon = { Icon(Icons.Default.Star, contentDescription = "VIP") },
                    label = { Text("VIP") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        indicatorColor = Color(0xFF4F46E5)
                    )
                )

                NavigationBarItem(
                    selected = currentTab == ScreenTab.SUPPORT,
                    onClick = { currentTab = ScreenTab.SUPPORT },
                    icon = { Icon(Icons.Default.HeadsetMic, contentDescription = "Support") },
                    label = { Text("Support") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        indicatorColor = Color(0xFF4F46E5)
                    )
                )
            }
        }
    ) { innerPadding ->
        Surface(modifier = Modifier.padding(innerPadding)) {
            when (currentTab) {
                ScreenTab.RANDOM_MATCH -> RandomMatchScreen(userId = user.id)
                ScreenTab.EVENTS -> EventsScreen(userId = user.id)
                ScreenTab.CELEBRITIES -> CelebrityScreen(userId = user.id)
                ScreenTab.SUPPORT -> SupportScreen(userId = user.id)
            }
        }
    }
}
}
