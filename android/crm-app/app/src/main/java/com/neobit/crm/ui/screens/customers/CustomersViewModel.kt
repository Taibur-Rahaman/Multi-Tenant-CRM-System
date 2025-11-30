package com.neobit.crm.ui.screens.customers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neobit.crm.data.model.Customer
import com.neobit.crm.data.repository.CRMRepository
import com.neobit.crm.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CustomersUiState {
    data object Loading : CustomersUiState()
    data class Success(val customers: List<Customer>) : CustomersUiState()
    data class Error(val message: String) : CustomersUiState()
}

@HiltViewModel
class CustomersViewModel @Inject constructor(
    private val crmRepository: CRMRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<CustomersUiState>(CustomersUiState.Loading)
    val uiState: StateFlow<CustomersUiState> = _uiState.asStateFlow()
    
    private var searchJob: Job? = null
    
    fun loadCustomers() {
        viewModelScope.launch {
            _uiState.value = CustomersUiState.Loading
            
            when (val result = crmRepository.getCustomers()) {
                is Result.Success -> {
                    _uiState.value = CustomersUiState.Success(result.data.content)
                }
                is Result.Error -> {
                    _uiState.value = CustomersUiState.Error(result.message)
                }
                is Result.Loading -> {
                    _uiState.value = CustomersUiState.Loading
                }
            }
        }
    }
    
    fun searchCustomers(query: String) {
        searchJob?.cancel()
        
        if (query.isBlank()) {
            loadCustomers()
            return
        }
        
        searchJob = viewModelScope.launch {
            delay(300) // Debounce
            
            when (val result = crmRepository.searchCustomers(query)) {
                is Result.Success -> {
                    _uiState.value = CustomersUiState.Success(result.data.content)
                }
                is Result.Error -> {
                    _uiState.value = CustomersUiState.Error(result.message)
                }
                is Result.Loading -> {}
            }
        }
    }
}

