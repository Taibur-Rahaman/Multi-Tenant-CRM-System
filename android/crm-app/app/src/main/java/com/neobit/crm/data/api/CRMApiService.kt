package com.neobit.crm.data.api

import com.neobit.crm.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface CRMApiService {
    
    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body body: Map<String, String>): Response<ApiResponse<AuthResponse>>
    
    @POST("auth/logout")
    suspend fun logout(@Body body: Map<String, String>): Response<ApiResponse<Unit>>
    
    // Users
    @GET("users/me")
    suspend fun getCurrentUser(): Response<ApiResponse<User>>
    
    // Dashboard
    @GET("dashboard/stats")
    suspend fun getDashboardStats(): Response<ApiResponse<DashboardStats>>
    
    // Customers
    @GET("customers")
    suspend fun getCustomers(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<ApiResponse<PageResponse<Customer>>>
    
    @GET("customers/{id}")
    suspend fun getCustomer(@Path("id") id: String): Response<ApiResponse<Customer>>
    
    @GET("customers/search")
    suspend fun searchCustomers(
        @Query("q") query: String,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<ApiResponse<PageResponse<Customer>>>
    
    @GET("customers/leads")
    suspend fun getLeads(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<ApiResponse<PageResponse<Customer>>>
    
    @POST("customers")
    suspend fun createCustomer(@Body request: CreateCustomerRequest): Response<ApiResponse<Customer>>
    
    @PUT("customers/{id}")
    suspend fun updateCustomer(
        @Path("id") id: String,
        @Body request: CreateCustomerRequest
    ): Response<ApiResponse<Customer>>
    
    @DELETE("customers/{id}")
    suspend fun deleteCustomer(@Path("id") id: String): Response<ApiResponse<Unit>>
    
    // Interactions
    @GET("interactions")
    suspend fun getInteractions(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<ApiResponse<PageResponse<Interaction>>>
    
    @GET("interactions/customer/{customerId}")
    suspend fun getCustomerInteractions(
        @Path("customerId") customerId: String,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<ApiResponse<PageResponse<Interaction>>>
    
    @POST("interactions")
    suspend fun createInteraction(@Body request: CreateInteractionRequest): Response<ApiResponse<Interaction>>
    
    // Tasks
    @GET("tasks")
    suspend fun getTasks(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<ApiResponse<PageResponse<Task>>>
    
    @GET("tasks/my-tasks")
    suspend fun getMyTasks(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<ApiResponse<PageResponse<Task>>>
    
    @POST("tasks/{id}/complete")
    suspend fun completeTask(@Path("id") id: String): Response<ApiResponse<Task>>
}

interface AIApiService {
    
    @POST("chat")
    suspend fun chat(@Body body: Map<String, Any>): Response<ApiResponse<Map<String, Any>>>
    
    @POST("summarize/entity")
    suspend fun summarizeEntity(@Body body: Map<String, String>): Response<ApiResponse<AISummary>>
    
    @GET("insights/customer/{customerId}")
    suspend fun getCustomerInsights(@Path("customerId") customerId: String): Response<ApiResponse<Map<String, Any>>>
}

