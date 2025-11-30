package com.neobit.crm.ui.screens.tasks

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.neobit.crm.data.model.Task

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(viewModel: TasksViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) { viewModel.loadTasks() }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Tasks", fontWeight = FontWeight.Bold) }
            )
        }
    ) { paddingValues ->
        when (val state = uiState) {
            is TasksUiState.Loading -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is TasksUiState.Error -> {
                Box(Modifier.fillMaxSize().padding(paddingValues), Alignment.Center) {
                    Text(state.message, color = MaterialTheme.colorScheme.error)
                }
            }
            is TasksUiState.Success -> {
                if (state.tasks.isEmpty()) {
                    Box(Modifier.fillMaxSize().padding(paddingValues), Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.CheckCircle, null, Modifier.size(64.dp), 
                                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                            Spacer(Modifier.height(16.dp))
                            Text("All caught up!", fontWeight = FontWeight.Medium)
                        }
                    }
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize().padding(paddingValues),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(state.tasks) { task ->
                            TaskItem(task = task, onComplete = { viewModel.completeTask(task.id) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TaskItem(task: Task, onComplete: () -> Unit) {
    val priorityColor = when (task.priority.lowercase()) {
        "high" -> Color(0xFFEF4444)
        "medium" -> Color(0xFFF59E0B)
        else -> Color(0xFF10B981)
    }
    
    Card(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.Top) {
            Checkbox(
                checked = task.status == "completed",
                onCheckedChange = { if (!it.not()) onComplete() }
            )
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(task.title, fontWeight = FontWeight.Medium)
                if (task.description != null) {
                    Text(task.description, fontSize = 14.sp, 
                        color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                }
                Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(shape = RoundedCornerShape(4.dp), color = priorityColor.copy(alpha = 0.1f)) {
                        Text(task.priority.replaceFirstChar { it.uppercase() },
                            Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                            fontSize = 12.sp, color = priorityColor, fontWeight = FontWeight.Medium)
                    }
                    if (task.dueDate != null) {
                        Text("Due: ${task.dueDate.take(10)}", fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

