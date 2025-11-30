package com.neobit.crm.ui.screens.interactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neobit.crm.data.model.CreateInteractionRequest
import com.neobit.crm.data.repository.CRMRepository
import com.neobit.crm.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class LogInteractionUiState {
    data object Idle : LogInteractionUiState()
    data object Loading : LogInteractionUiState()
    data object Success : LogInteractionUiState()
    data class Error(val message: String) : LogInteractionUiState()
}

@HiltViewModel
class LogInteractionViewModel @Inject constructor(
    private val crmRepository: CRMRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<LogInteractionUiState>(LogInteractionUiState.Idle)
    val uiState: StateFlow<LogInteractionUiState> = _uiState.asStateFlow()
    
    fun logInteraction(request: CreateInteractionRequest) {
        viewModelScope.launch {
            _uiState.value = LogInteractionUiState.Loading
            when (val result = crmRepository.createInteraction(request)) {
                is Result.Success -> _uiState.value = LogInteractionUiState.Success
                is Result.Error -> _uiState.value = LogInteractionUiState.Error(result.message)
                is Result.Loading -> _uiState.value = LogInteractionUiState.Loading
            }
        }
    }
}

