package com.friendconnect.app.service

import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject

sealed class MatchState {
    object Idle : MatchState()
    object Searching : MatchState()
    data class Connected(
        val roomId: String,
        val peerId: String,
        val peerName: String,
        val peerAvatar: String,
        val isInitiator: Boolean
    ) : MatchState()
}

object CallManager {
    private var socket: Socket? = null
    private const val SOCKET_URL = "http://10.0.2.2:4000"

    private val _matchState = MutableStateFlow<MatchState>(MatchState.Idle)
    val matchState: StateFlow<MatchState> = _matchState

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted

    fun initSocket() {
        try {
            socket = IO.socket(SOCKET_URL)
            setupListeners()
            socket?.connect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun setupListeners() {
        socket?.on("queue_waiting") {
            _matchState.value = MatchState.Searching
        }

        socket?.on("match_found") { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as JSONObject
                val roomId = data.getString("roomId")
                val isInitiator = data.getBoolean("isInitiator")
                val peer = data.getJSONObject("peer")

                _matchState.value = MatchState.Connected(
                    roomId = roomId,
                    peerId = peer.getString("id"),
                    peerName = peer.getString("name"),
                    peerAvatar = peer.optString("avatarUrl", ""),
                    isInitiator = isInitiator
                )
            }
        }

        socket?.on("call_ended") {
            _matchState.value = MatchState.Idle
        }
    }

    fun startRandomMatch(userId: String) {
        val payload = JSONObject().apply {
            put("userId", userId)
        }
        socket?.emit("join_match_queue", payload)
        _matchState.value = MatchState.Searching
    }

    fun cancelRandomMatch() {
        socket?.emit("leave_match_queue")
        _matchState.value = MatchState.Idle
    }

    fun endCall() {
        socket?.emit("end_random_call")
        _matchState.value = MatchState.Idle
    }

    fun toggleMute() {
        _isMuted.value = !_isMuted.value
    }
}
