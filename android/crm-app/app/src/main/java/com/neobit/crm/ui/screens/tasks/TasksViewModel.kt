package com.neobit.crm.ui.screens.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neobit.crm.data.model.Task
import com.neobit.crm.data.repository.CRMRepository
import com.neobit.crm.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class TasksUiState {
    data object Loading : TasksUiState()
    data class Success(val tasks: List<Task>) : TasksUiState()
    data class Error(val message: String) : TasksUiState()
}

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val crmRepository: CRMRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<TasksUiState>(TasksUiState.Loading)
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()
    
    fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = TasksUiState.Loading
            when (val result = crmRepository.getMyTasks()) {
                is Result.Success -> _uiState.value = TasksUiState.Success(result.data.content)
                is Result.Error -> _uiState.value = TasksUiState.Error(result.message)
                is Result.Loading -> _uiState.value = TasksUiState.Loading
            }
        }
    }
    
    fun completeTask(taskId: String) {
        viewModelScope.launch {
            crmRepository.completeTask(taskId)
            loadTasks()
        }
    }
}

