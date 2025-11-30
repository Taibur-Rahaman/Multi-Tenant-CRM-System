package com.neobit.crm.ui.screens.interactions

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.neobit.crm.data.model.CreateInteractionRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LogInteractionScreen(
    customerId: String?,
    viewModel: LogInteractionViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var type by remember { mutableStateOf("CALL") }
    var subject by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var duration by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }
    
    val types = listOf("CALL", "EMAIL", "MEETING", "MESSAGE", "NOTE")
    
    LaunchedEffect(uiState) {
        if (uiState is LogInteractionUiState.Success) onSuccess()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Log Interaction") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.Close, "Close")
                    }
                },
                actions = {
                    TextButton(
                        onClick = {
                            viewModel.logInteraction(
                                CreateInteractionRequest(
                                    customerId = customerId,
                                    type = type,
                                    subject = subject.ifBlank { null },
                                    description = description.ifBlank { null },
                                    durationSeconds = duration.toIntOrNull()
                                )
                            )
                        },
                        enabled = uiState !is LogInteractionUiState.Loading
                    ) {
                        Text("Save", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Type Selector
            ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                OutlinedTextField(
                    value = type,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Type") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                    modifier = Modifier.fillMaxWidth().menuAnchor()
                )
                ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                    types.forEach { option ->
                        DropdownMenuItem(
                            text = { Text(option) },
                            onClick = { type = option; expanded = false }
                        )
                    }
                }
            }
            
            OutlinedTextField(
                value = subject,
                onValueChange = { subject = it },
                label = { Text("Subject") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Notes") },
                modifier = Modifier.fillMaxWidth().height(150.dp),
                maxLines = 6
            )
            
            if (type == "CALL" || type == "MEETING") {
                OutlinedTextField(
                    value = duration,
                    onValueChange = { duration = it.filter { c -> c.isDigit() } },
                    label = { Text("Duration (seconds)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            }
            
            if (uiState is LogInteractionUiState.Error) {
                Text(
                    (uiState as LogInteractionUiState.Error).message,
                    color = MaterialTheme.colorScheme.error
                )
            }
            
            if (uiState is LogInteractionUiState.Loading) {
                LinearProgressIndicator(Modifier.fillMaxWidth())
            }
        }
    }
}

