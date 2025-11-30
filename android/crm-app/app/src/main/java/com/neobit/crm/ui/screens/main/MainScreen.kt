package com.neobit.crm.ui.screens.main

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.neobit.crm.ui.screens.customers.CustomersScreen
import com.neobit.crm.ui.screens.dashboard.DashboardScreen
import com.neobit.crm.ui.screens.settings.SettingsScreen
import com.neobit.crm.ui.screens.tasks.TasksScreen

data class BottomNavItem(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

val bottomNavItems = listOf(
    BottomNavItem("home", "Home", Icons.Filled.Home, Icons.Outlined.Home),
    BottomNavItem("customers", "Customers", Icons.Filled.People, Icons.Outlined.People),
    BottomNavItem("tasks", "Tasks", Icons.Filled.CheckCircle, Icons.Outlined.CheckCircle),
    BottomNavItem("settings", "Settings", Icons.Filled.Settings, Icons.Outlined.Settings)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onNavigateToCustomerDetail: (String) -> Unit,
    onNavigateToLogInteraction: (String?) -> Unit,
    onLogout: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    
    Scaffold(
        bottomBar = {
            NavigationBar {
                bottomNavItems.forEach { item ->
                    val selected = currentDestination?.hierarchy?.any { it.route == item.route } == true
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                                contentDescription = item.title
                            )
                        },
                        label = { Text(item.title) }
                    )
                }
            }
        },
        floatingActionButton = {
            if (currentDestination?.route == "customers" || currentDestination?.route == "home") {
                FloatingActionButton(
                    onClick = { onNavigateToLogInteraction(null) },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Log Interaction")
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(paddingValues)
        ) {
            composable("home") {
                DashboardScreen(
                    onCustomerClick = onNavigateToCustomerDetail
                )
            }
            composable("customers") {
                CustomersScreen(
                    onCustomerClick = onNavigateToCustomerDetail
                )
            }
            composable("tasks") {
                TasksScreen()
            }
            composable("settings") {
                SettingsScreen(onLogout = onLogout)
            }
        }
    }
}

