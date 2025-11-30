package com.neobit.crm.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import com.neobit.crm.ui.screens.login.LoginViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    loginViewModel: LoginViewModel = hiltViewModel(),
    onLogout: () -> Unit
) {
    val user by loginViewModel.isLoggedIn.collectAsState(initial = true)
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Settings", fontWeight = FontWeight.Bold) })
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // Profile Card
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(60.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("A", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Admin User", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("admin@demo.com", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            
            Spacer(Modifier.height(24.dp))
            
            // Settings Items
            SettingsItem(icon = Icons.Default.Person, title = "Profile", onClick = {})
            SettingsItem(icon = Icons.Default.Notifications, title = "Notifications", onClick = {})
            SettingsItem(icon = Icons.Default.Security, title = "Security", onClick = {})
            SettingsItem(icon = Icons.Default.Language, title = "Language", onClick = {})
            SettingsItem(icon = Icons.Default.Help, title = "Help & Support", onClick = {})
            SettingsItem(icon = Icons.Default.Info, title = "About", onClick = {})
            
            Spacer(Modifier.weight(1f))
            
            // Logout Button
            Button(
                onClick = {
                    loginViewModel.logout()
                    onLogout()
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Icon(Icons.Default.Logout, null)
                Spacer(Modifier.width(8.dp))
                Text("Logout")
            }
            
            Spacer(Modifier.height(16.dp))
            
            Text(
                text = "CRM Pro v1.0.0",
                modifier = Modifier.align(Alignment.CenterHorizontally),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
fun SettingsItem(icon: ImageVector, title: String, onClick: () -> Unit) {
    Surface(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.width(16.dp))
            Text(title, modifier = Modifier.weight(1f))
            Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
    HorizontalDivider()
}

