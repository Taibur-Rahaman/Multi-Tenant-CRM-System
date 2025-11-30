package com.neobit.crm.ui.screens.customers

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.neobit.crm.data.model.Customer
import com.neobit.crm.data.model.Interaction

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerDetailScreen(
    customerId: String,
    viewModel: CustomerDetailViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onLogInteraction: () -> Unit
) {
    val customerState by viewModel.customerState.collectAsState()
    val interactionsState by viewModel.interactionsState.collectAsState()
    
    LaunchedEffect(customerId) {
        viewModel.loadCustomer(customerId)
        viewModel.loadInteractions(customerId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Customer Details") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { /* Edit */ }) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit")
                    }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onLogInteraction,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Log Interaction") }
            )
        }
    ) { paddingValues ->
        when (val state = customerState) {
            is CustomerDetailState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            is CustomerDetailState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = state.message, color = MaterialTheme.colorScheme.error)
                }
            }
            is CustomerDetailState.Success -> {
                CustomerDetailContent(
                    customer = state.customer,
                    interactions = (interactionsState as? InteractionsState.Success)?.interactions ?: emptyList(),
                    modifier = Modifier.padding(paddingValues)
                )
            }
        }
    }
}

@Composable
fun CustomerDetailContent(
    customer: Customer,
    interactions: List<Interaction>,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Surface(
                        modifier = Modifier.size(80.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = customer.firstName.take(1).uppercase(),
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = customer.fullName,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (customer.jobTitle != null) {
                        Text(
                            text = customer.jobTitle,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                        )
                    }
                    if (customer.accountName != null) {
                        Text(
                            text = customer.accountName,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    StatusChip(status = customer.leadStatus)
                }
            }
        }
        
        // Quick Actions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                QuickActionButton(
                    icon = Icons.Default.Phone,
                    label = "Call",
                    onClick = { /* Make call */ }
                )
                QuickActionButton(
                    icon = Icons.Default.Email,
                    label = "Email",
                    onClick = { /* Send email */ }
                )
                QuickActionButton(
                    icon = Icons.Default.Message,
                    label = "Message",
                    onClick = { /* Send message */ }
                )
            }
        }
        
        // Contact Info
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Contact Information",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    if (customer.email != null) {
                        InfoRow(icon = Icons.Default.Email, label = "Email", value = customer.email)
                    }
                    if (customer.phone != null) {
                        InfoRow(icon = Icons.Default.Phone, label = "Phone", value = customer.phone)
                    }
                    if (customer.mobile != null) {
                        InfoRow(icon = Icons.Default.PhoneAndroid, label = "Mobile", value = customer.mobile)
                    }
                    if (customer.city != null || customer.country != null) {
                        InfoRow(
                            icon = Icons.Default.LocationOn,
                            label = "Location",
                            value = listOfNotNull(customer.city, customer.country).joinToString(", ")
                        )
                    }
                }
            }
        }
        
        // Interactions
        item {
            Text(
                text = "Recent Interactions (${interactions.size})",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        }
        
        if (interactions.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No interactions yet",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(interactions) { interaction ->
                InteractionItem(interaction = interaction)
            }
        }
    }
}

@Composable
fun QuickActionButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        FilledTonalIconButton(
            onClick = onClick,
            modifier = Modifier.size(56.dp)
        ) {
            Icon(icon, contentDescription = label)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = label, fontSize = 12.sp)
    }
}

@Composable
fun InfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = label,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(text = value)
        }
    }
}

@Composable
fun InteractionItem(interaction: Interaction) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            val icon = when (interaction.type) {
                "CALL" -> Icons.Default.Phone
                "EMAIL" -> Icons.Default.Email
                "MEETING" -> Icons.Default.Event
                "MESSAGE" -> Icons.Default.Message
                else -> Icons.Default.Note
            }
            
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = interaction.subject ?: "${interaction.type} interaction",
                    fontWeight = FontWeight.Medium
                )
                if (interaction.description != null) {
                    Text(
                        text = interaction.description,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2
                    )
                }
                Text(
                    text = interaction.createdAt.take(10),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

