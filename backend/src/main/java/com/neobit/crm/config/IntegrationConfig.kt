package com.neobit.crm.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "integrations")
class IntegrationProperties {
    var google = GoogleConfig()
    var twilio = TwilioConfig()
    var telegram = TelegramConfig()
    var jira = JiraConfig()
    var openai = OpenAIConfig()
    
    class GoogleConfig {
        var clientId: String = ""
        var clientSecret: String = ""
        var redirectUri: String = ""
        var scopes: List<String> = listOf(
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/calendar"
        )
    }
    
    class TwilioConfig {
        var accountSid: String = ""
        var authToken: String = ""
        var defaultFromNumber: String = ""
    }
    
    class TelegramConfig {
        var botToken: String = ""
        var webhookSecret: String = ""
    }
    
    class JiraConfig {
        var baseUrl: String = ""
        var email: String = ""
        var apiToken: String = ""
    }
    
    class OpenAIConfig {
        var apiKey: String = ""
        var model: String = "gpt-4"
        var maxTokens: Int = 2000
    }
}

