package com.neobit.crm.ui.screens.customers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.neobit.crm.data.model.Customer
import com.neobit.crm.data.model.Interaction
import com.neobit.crm.data.repository.CRMRepository
import com.neobit.crm.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CustomerDetailState {
    data object Loading : CustomerDetailState()
    data class Success(val customer: Customer) : CustomerDetailState()
    data class Error(val message: String) : CustomerDetailState()
}

sealed class InteractionsState {
    data object Loading : InteractionsState()
    data class Success(val interactions: List<Interaction>) : InteractionsState()
    data class Error(val message: String) : InteractionsState()
}

@HiltViewModel
class CustomerDetailViewModel @Inject constructor(
    private val crmRepository: CRMRepository
) : ViewModel() {
    
    private val _customerState = MutableStateFlow<CustomerDetailState>(CustomerDetailState.Loading)
    val customerState: StateFlow<CustomerDetailState> = _customerState.asStateFlow()
    
    private val _interactionsState = MutableStateFlow<InteractionsState>(InteractionsState.Loading)
    val interactionsState: StateFlow<InteractionsState> = _interactionsState.asStateFlow()
    
    fun loadCustomer(customerId: String) {
        viewModelScope.launch {
            _customerState.value = CustomerDetailState.Loading
            when (val result = crmRepository.getCustomer(customerId)) {
                is Result.Success -> _customerState.value = CustomerDetailState.Success(result.data)
                is Result.Error -> _customerState.value = CustomerDetailState.Error(result.message)
                is Result.Loading -> _customerState.value = CustomerDetailState.Loading
            }
        }
    }
    
    fun loadInteractions(customerId: String) {
        viewModelScope.launch {
            _interactionsState.value = InteractionsState.Loading
            when (val result = crmRepository.getCustomerInteractions(customerId)) {
                is Result.Success -> _interactionsState.value = InteractionsState.Success(result.data.content)
                is Result.Error -> _interactionsState.value = InteractionsState.Error(result.message)
                is Result.Loading -> _interactionsState.value = InteractionsState.Loading
            }
        }
    }
}

