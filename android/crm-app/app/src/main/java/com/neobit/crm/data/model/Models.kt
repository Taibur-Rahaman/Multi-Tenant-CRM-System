package com.neobit.crm.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null,
    val timestamp: String? = null
)

@Serializable
data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val tenantSlug: String? = null
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String,
    val expiresIn: Long,
    val user: User
)

@Serializable
data class User(
    val id: String,
    val tenantId: String,
    val tenantName: String,
    val email: String,
    val firstName: String,
    val lastName: String? = null,
    val fullName: String,
    val phone: String? = null,
    val avatarUrl: String? = null,
    val role: String,
    val isActive: Boolean,
    val emailVerified: Boolean
)

@Serializable
data class Customer(
    val id: String,
    val accountId: String? = null,
    val accountName: String? = null,
    val firstName: String,
    val lastName: String? = null,
    val fullName: String,
    val email: String? = null,
    val phone: String? = null,
    val mobile: String? = null,
    val jobTitle: String? = null,
    val department: String? = null,
    val city: String? = null,
    val country: String? = null,
    val leadSource: String? = null,
    val leadStatus: String,
    val leadScore: Int = 0,
    val isLead: Boolean = true,
    val ownerName: String? = null,
    val tags: List<String> = emptyList(),
    val lastContactedAt: String? = null,
    val interactionCount: Int = 0,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateCustomerRequest(
    val firstName: String,
    val lastName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val mobile: String? = null,
    val jobTitle: String? = null,
    val leadSource: String? = null,
    val leadStatus: String = "new",
    val accountId: String? = null,
    val tags: List<String>? = null
)

@Serializable
data class Interaction(
    val id: String,
    val customerId: String? = null,
    val customerName: String? = null,
    val accountId: String? = null,
    val accountName: String? = null,
    val userId: String? = null,
    val userName: String? = null,
    val type: String,
    val direction: String,
    val status: String,
    val subject: String? = null,
    val description: String? = null,
    val summary: String? = null,
    val durationSeconds: Int? = null,
    val scheduledAt: String? = null,
    val tags: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateInteractionRequest(
    val customerId: String? = null,
    val type: String,
    val direction: String = "OUTBOUND",
    val status: String = "COMPLETED",
    val subject: String? = null,
    val description: String? = null,
    val durationSeconds: Int? = null,
    val tags: List<String>? = null
)

@Serializable
data class Task(
    val id: String,
    val title: String,
    val description: String? = null,
    val status: String,
    val priority: String,
    val dueDate: String? = null,
    val completedAt: String? = null,
    val customerName: String? = null,
    val assignedToName: String? = null,
    val tags: List<String> = emptyList(),
    val createdAt: String
)

@Serializable
data class DashboardStats(
    val totalCustomers: Long,
    val totalLeads: Long,
    val totalAccounts: Long,
    val totalInteractions: Long,
    val recentInteractions: Long,
    val totalTasks: Long,
    val pendingTasks: Long,
    val interactionsByType: Map<String, Long> = emptyMap()
)

@Serializable
data class AISummary(
    val summary: String,
    val sentiment: String? = null,
    val insights: List<String>? = null
)

