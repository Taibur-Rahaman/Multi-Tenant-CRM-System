package com.neobit.crm.data.repository

import com.neobit.crm.data.api.CRMApiService
import com.neobit.crm.data.local.TokenManager
import com.neobit.crm.data.model.AuthResponse
import com.neobit.crm.data.model.LoginRequest
import com.neobit.crm.data.model.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val code: Int? = null) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: CRMApiService,
    private val tokenManager: TokenManager
) {
    val isLoggedIn: Flow<Boolean> = tokenManager.isLoggedIn
    val currentUser: Flow<User?> = tokenManager.currentUser
    
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body()?.success == true) {
                val authResponse = response.body()!!.data!!
                tokenManager.saveTokens(
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken,
                    user = authResponse.user
                )
                Result.Success(authResponse)
            } else {
                Result.Error(response.body()?.message ?: "Login failed")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun logout() {
        try {
            val refreshToken = tokenManager.refreshToken.first()
            if (refreshToken != null) {
                apiService.logout(mapOf("refreshToken" to refreshToken))
            }
        } catch (e: Exception) {
            // Ignore errors during logout
        } finally {
            tokenManager.clearTokens()
        }
    }
    
    suspend fun refreshToken(): Result<AuthResponse> {
        return try {
            val refreshToken = tokenManager.refreshToken.first() 
                ?: return Result.Error("No refresh token")
            
            val response = apiService.refreshToken(mapOf("refreshToken" to refreshToken))
            if (response.isSuccessful && response.body()?.success == true) {
                val authResponse = response.body()!!.data!!
                tokenManager.saveTokens(
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken,
                    user = authResponse.user
                )
                Result.Success(authResponse)
            } else {
                tokenManager.clearTokens()
                Result.Error("Token refresh failed")
            }
        } catch (e: Exception) {
            tokenManager.clearTokens()
            Result.Error(e.message ?: "Token refresh failed")
        }
    }
    
    suspend fun getAccessToken(): String? = tokenManager.accessToken.first()
}

