package com.friendconnect.app.data.api

import com.friendconnect.app.data.model.*
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface ApiService {

    @POST("api/auth/send-otp")
    suspend fun sendOtp(@Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("api/auth/verify-otp")
    suspend fun verifyOtp(@Body body: Map<String, String>): Response<Map<String, Any>>

    @GET("api/events")
    suspend fun getNearbyEvents(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Int
    ): Response<EventsResponse>

    @POST("api/events/{id}/book")
    suspend fun bookTicket(
        @Path("id") eventId: String,
        @Body body: Map<String, Any>
    ): Response<Map<String, Any>>

    @GET("api/celebrities")
    suspend fun getCelebrities(): Response<CelebritiesResponse>

    @POST("api/celebrities/{id}/request-call")
    suspend fun requestCelebrityCall(
        @Path("id") celebId: String,
        @Body body: Map<String, String>
    ): Response<CallResponse>

    @POST("api/support/ticket")
    suspend fun getSupportTicket(@Body body: Map<String, String>): Response<SupportTicketResponse>

    @POST("api/support/call/request")
    suspend fun requestSupportCall(@Body body: Map<String, String>): Response<Map<String, Any>>

    companion object {
        // Base URL pointing to host machine (10.0.2.2 for Android emulator)
        private const val BASE_URL = "http://10.0.2.2:4000/"

        fun create(): ApiService {
            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        }
    }
}
