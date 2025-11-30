package com.neobit.crm.data.repository

import com.neobit.crm.data.api.CRMApiService
import com.neobit.crm.data.model.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CRMRepository @Inject constructor(
    private val apiService: CRMApiService
) {
    // Dashboard
    suspend fun getDashboardStats(): Result<DashboardStats> {
        return try {
            val response = apiService.getDashboardStats()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to load stats")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    // Customers
    suspend fun getCustomers(page: Int = 0, size: Int = 20): Result<PageResponse<Customer>> {
        return try {
            val response = apiService.getCustomers(page, size)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to load customers")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun getCustomer(id: String): Result<Customer> {
        return try {
            val response = apiService.getCustomer(id)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Customer not found")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun searchCustomers(query: String, page: Int = 0): Result<PageResponse<Customer>> {
        return try {
            val response = apiService.searchCustomers(query, page)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Search failed")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun createCustomer(request: CreateCustomerRequest): Result<Customer> {
        return try {
            val response = apiService.createCustomer(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to create customer")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    // Interactions
    suspend fun getInteractions(page: Int = 0, size: Int = 20): Result<PageResponse<Interaction>> {
        return try {
            val response = apiService.getInteractions(page, size)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to load interactions")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun getCustomerInteractions(customerId: String, page: Int = 0): Result<PageResponse<Interaction>> {
        return try {
            val response = apiService.getCustomerInteractions(customerId, page)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to load interactions")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun createInteraction(request: CreateInteractionRequest): Result<Interaction> {
        return try {
            val response = apiService.createInteraction(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to log interaction")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    // Tasks
    suspend fun getMyTasks(page: Int = 0): Result<PageResponse<Task>> {
        return try {
            val response = apiService.getMyTasks(page)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to load tasks")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
    
    suspend fun completeTask(taskId: String): Result<Task> {
        return try {
            val response = apiService.completeTask(taskId)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.Success(response.body()!!.data!!)
            } else {
                Result.Error(response.body()?.message ?: "Failed to complete task")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Network error")
        }
    }
}

