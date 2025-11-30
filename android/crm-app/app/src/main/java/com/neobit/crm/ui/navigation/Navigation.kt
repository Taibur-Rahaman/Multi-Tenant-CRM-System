package com.neobit.crm.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.neobit.crm.ui.screens.customers.CustomerDetailScreen
import com.neobit.crm.ui.screens.customers.CustomersScreen
import com.neobit.crm.ui.screens.dashboard.DashboardScreen
import com.neobit.crm.ui.screens.interactions.LogInteractionScreen
import com.neobit.crm.ui.screens.login.LoginScreen
import com.neobit.crm.ui.screens.login.LoginViewModel
import com.neobit.crm.ui.screens.main.MainScreen

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Main : Screen("main")
    data object Dashboard : Screen("dashboard")
    data object Customers : Screen("customers")
    data object CustomerDetail : Screen("customer/{customerId}") {
        fun createRoute(customerId: String) = "customer/$customerId"
    }
    data object LogInteraction : Screen("log-interaction?customerId={customerId}") {
        fun createRoute(customerId: String? = null) = 
            if (customerId != null) "log-interaction?customerId=$customerId" else "log-interaction"
    }
    data object Tasks : Screen("tasks")
    data object Calls : Screen("calls")
    data object Settings : Screen("settings")
}

@Composable
fun CRMNavHost() {
    val navController = rememberNavController()
    val loginViewModel: LoginViewModel = hiltViewModel()
    val isLoggedIn by loginViewModel.isLoggedIn.collectAsState(initial = false)
    
    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) Screen.Main.route else Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Main.route) {
            MainScreen(
                onNavigateToCustomerDetail = { customerId ->
                    navController.navigate(Screen.CustomerDetail.createRoute(customerId))
                },
                onNavigateToLogInteraction = { customerId ->
                    navController.navigate(Screen.LogInteraction.createRoute(customerId))
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Main.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(
            route = Screen.CustomerDetail.route,
            arguments = listOf(navArgument("customerId") { type = NavType.StringType })
        ) { backStackEntry ->
            val customerId = backStackEntry.arguments?.getString("customerId") ?: ""
            CustomerDetailScreen(
                customerId = customerId,
                onBack = { navController.popBackStack() },
                onLogInteraction = { 
                    navController.navigate(Screen.LogInteraction.createRoute(customerId))
                }
            )
        }
        
        composable(
            route = Screen.LogInteraction.route,
            arguments = listOf(
                navArgument("customerId") { 
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val customerId = backStackEntry.arguments?.getString("customerId")
            LogInteractionScreen(
                customerId = customerId,
                onBack = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
            )
        }
    }
}

