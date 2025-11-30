package com.neobit.crm.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neobit.crm.data.model.DashboardStats
import com.neobit.crm.data.repository.AuthRepository
import com.neobit.crm.data.repository.CRMRepository
import com.neobit.crm.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DashboardUiState {
    data object Loading : DashboardUiState()
    data class Success(val stats: DashboardStats) : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val crmRepository: CRMRepository,
    authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()
    
    val currentUser = authRepository.currentUser
    
    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Loading
            
            when (val result = crmRepository.getDashboardStats()) {
                is Result.Success -> {
                    _uiState.value = DashboardUiState.Success(result.data)
                }
                is Result.Error -> {
                    _uiState.value = DashboardUiState.Error(result.message)
                }
                is Result.Loading -> {
                    _uiState.value = DashboardUiState.Loading
                }
            }
        }
    }
}

