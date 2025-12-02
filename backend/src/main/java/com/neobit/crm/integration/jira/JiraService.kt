package com.neobit.crm.integration.jira

import com.fasterxml.jackson.databind.ObjectMapper
import com.neobit.crm.entity.IntegrationConfig
import com.neobit.crm.repository.IntegrationConfigRepository
import org.slf4j.LoggerFactory
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.util.*

data class JiraIssue(
    val id: String,
    val key: String,
    val summary: String,
    val description: String?,
    val status: String,
    val priority: String?,
    val issueType: String,
    val assignee: String?,
    val reporter: String?,
    val created: String,
    val updated: String,
    val labels: List<String>
)

data class CreateJiraIssueRequest(
    val projectKey: String,
    val summary: String,
    val description: String? = null,
    val issueType: String = "Task",
    val priority: String? = null,
    val labels: List<String> = emptyList(),
    val assigneeAccountId: String? = null,
    val customFields: Map<String, Any> = emptyMap()
)

data class UpdateJiraIssueRequest(
    val summary: String? = null,
    val description: String? = null,
    val priority: String? = null,
    val labels: List<String>? = null,
    val status: String? = null
)

@Service
class JiraService(
    private val integrationConfigRepository: IntegrationConfigRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(JiraService::class.java)
    private val restTemplate = RestTemplate()
    
    data class JiraConfig(
        val baseUrl: String,
        val email: String,
        val apiToken: String
    )
    
    fun getJiraConfig(tenantId: UUID): JiraConfig? {
        val configEntity = integrationConfigRepository.findByTenantIdAndIntegrationType(
            tenantId, "jira"
        ).orElse(null) ?: return null
        
        if (configEntity.isEnabled != true) return null
        
        val configMap = configEntity.config ?: emptyMap()
        val credentialsMap = configEntity.credentials ?: emptyMap()
        
        return JiraConfig(
            baseUrl = configMap["baseUrl"] as? String ?: return null,
            email = credentialsMap["email"] as? String ?: return null,
            apiToken = credentialsMap["apiToken"] as? String ?: return null
        )
    }
    
    private fun createHeaders(config: JiraConfig): HttpHeaders {
        return HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBasicAuth(config.email, config.apiToken)
        }
    }
    
    fun createIssue(tenantId: UUID, request: CreateJiraIssueRequest): JiraIssue? {
        val config = getJiraConfig(tenantId) ?: return null
        
        val url = "${config.baseUrl}/rest/api/3/issue"
        
        val fields = mutableMapOf<String, Any>(
            "project" to mapOf("key" to request.projectKey),
            "summary" to request.summary,
            "issuetype" to mapOf("name" to request.issueType)
        )
        
        if (request.description != null) {
            fields["description"] = mapOf(
                "type" to "doc",
                "version" to 1,
                "content" to listOf(
                    mapOf(
                        "type" to "paragraph",
                        "content" to listOf(
                            mapOf("type" to "text", "text" to request.description)
                        )
                    )
                )
            )
        }
        
        if (request.priority != null) {
            fields["priority"] = mapOf("name" to request.priority)
        }
        
        if (request.labels.isNotEmpty()) {
            fields["labels"] = request.labels
        }
        
        if (request.assigneeAccountId != null) {
            fields["assignee"] = mapOf("accountId" to request.assigneeAccountId)
        }
        
        fields.putAll(request.customFields)
        
        val body = mapOf("fields" to fields)
        
        return try {
            val entity = HttpEntity(body, createHeaders(config))
            val response = restTemplate.postForEntity(url, entity, Map::class.java)
            
            val issueKey = response.body?.get("key") as? String ?: return null
            getIssue(tenantId, issueKey)
        } catch (e: Exception) {
            logger.error("Failed to create Jira issue", e)
            null
        }
    }
    
    fun getIssue(tenantId: UUID, issueKey: String): JiraIssue? {
        val config = getJiraConfig(tenantId) ?: return null
        
        val url = "${config.baseUrl}/rest/api/3/issue/$issueKey"
        
        return try {
            val entity = HttpEntity<Any>(createHeaders(config))
            val response = restTemplate.exchange(url, HttpMethod.GET, entity, Map::class.java)
            parseIssue(response.body)
        } catch (e: Exception) {
            logger.error("Failed to get Jira issue", e)
            null
        }
    }
    
    fun searchIssues(tenantId: UUID, jql: String, maxResults: Int = 50): List<JiraIssue> {
        val config = getJiraConfig(tenantId) ?: return emptyList()
        
        val url = "${config.baseUrl}/rest/api/3/search"
        
        val body = mapOf(
            "jql" to jql,
            "maxResults" to maxResults,
            "fields" to listOf("summary", "description", "status", "priority", "issuetype", 
                              "assignee", "reporter", "created", "updated", "labels")
        )
        
        return try {
            val entity = HttpEntity(body, createHeaders(config))
            val response = restTemplate.postForEntity(url, entity, Map::class.java)
            
            val issues = response.body?.get("issues") as? List<*> ?: return emptyList()
            issues.mapNotNull { issue -> parseIssue(issue as? Map<*, *>) }
        } catch (e: Exception) {
            logger.error("Failed to search Jira issues", e)
            emptyList()
        }
    }
    
    fun updateIssue(tenantId: UUID, issueKey: String, request: UpdateJiraIssueRequest): JiraIssue? {
        val config = getJiraConfig(tenantId) ?: return null
        
        val url = "${config.baseUrl}/rest/api/3/issue/$issueKey"
        
        val fields = mutableMapOf<String, Any>()
        
        if (request.summary != null) fields["summary"] = request.summary
        if (request.description != null) {
            fields["description"] = mapOf(
                "type" to "doc",
                "version" to 1,
                "content" to listOf(
                    mapOf(
                        "type" to "paragraph",
                        "content" to listOf(
                            mapOf("type" to "text", "text" to request.description)
                        )
                    )
                )
            )
        }
        if (request.priority != null) fields["priority"] = mapOf("name" to request.priority)
        if (request.labels != null) fields["labels"] = request.labels
        
        if (fields.isEmpty()) return getIssue(tenantId, issueKey)
        
        val body = mapOf("fields" to fields)
        
        return try {
            val entity = HttpEntity(body, createHeaders(config))
            restTemplate.exchange(url, HttpMethod.PUT, entity, Void::class.java)
            
            // Handle status transition separately
            if (request.status != null) {
                transitionIssue(tenantId, issueKey, request.status)
            }
            
            getIssue(tenantId, issueKey)
        } catch (e: Exception) {
            logger.error("Failed to update Jira issue", e)
            null
        }
    }
    
    fun transitionIssue(tenantId: UUID, issueKey: String, targetStatus: String): Boolean {
        val config = getJiraConfig(tenantId) ?: return false
        
        // Get available transitions
        val transitionsUrl = "${config.baseUrl}/rest/api/3/issue/$issueKey/transitions"
        
        return try {
            val entity = HttpEntity<Any>(createHeaders(config))
            val response = restTemplate.exchange(transitionsUrl, HttpMethod.GET, entity, Map::class.java)
            
            val transitions = response.body?.get("transitions") as? List<*> ?: return false
            val transition = transitions.find { t ->
                val name = ((t as? Map<*, *>)?.get("name") as? String)?.lowercase()
                name == targetStatus.lowercase()
            } as? Map<*, *>
            
            val transitionId = transition?.get("id") as? String ?: return false
            
            // Perform transition
            val transitionBody = mapOf("transition" to mapOf("id" to transitionId))
            val transitionEntity = HttpEntity(transitionBody, createHeaders(config))
            restTemplate.postForEntity(transitionsUrl, transitionEntity, Void::class.java)
            true
        } catch (e: Exception) {
            logger.error("Failed to transition Jira issue", e)
            false
        }
    }
    
    fun addComment(tenantId: UUID, issueKey: String, comment: String): Boolean {
        val config = getJiraConfig(tenantId) ?: return false
        
        val url = "${config.baseUrl}/rest/api/3/issue/$issueKey/comment"
        
        val body = mapOf(
            "body" to mapOf(
                "type" to "doc",
                "version" to 1,
                "content" to listOf(
                    mapOf(
                        "type" to "paragraph",
                        "content" to listOf(
                            mapOf("type" to "text", "text" to comment)
                        )
                    )
                )
            )
        )
        
        return try {
            val entity = HttpEntity(body, createHeaders(config))
            restTemplate.postForEntity(url, entity, Map::class.java)
            true
        } catch (e: Exception) {
            logger.error("Failed to add Jira comment", e)
            false
        }
    }
    
    private fun parseIssue(data: Map<*, *>?): JiraIssue? {
        if (data == null) return null
        
        val fields = data["fields"] as? Map<*, *> ?: return null
        
        return JiraIssue(
            id = data["id"] as? String ?: return null,
            key = data["key"] as? String ?: return null,
            summary = fields["summary"] as? String ?: "",
            description = extractDescription(fields["description"]),
            status = (fields["status"] as? Map<*, *>)?.get("name") as? String ?: "Unknown",
            priority = (fields["priority"] as? Map<*, *>)?.get("name") as? String,
            issueType = (fields["issuetype"] as? Map<*, *>)?.get("name") as? String ?: "Task",
            assignee = (fields["assignee"] as? Map<*, *>)?.get("displayName") as? String,
            reporter = (fields["reporter"] as? Map<*, *>)?.get("displayName") as? String,
            created = fields["created"] as? String ?: "",
            updated = fields["updated"] as? String ?: "",
            labels = (fields["labels"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
        )
    }
    
    private fun extractDescription(description: Any?): String? {
        if (description == null) return null
        val doc = description as? Map<*, *> ?: return null
        val content = doc["content"] as? List<*> ?: return null
        
        return content.mapNotNull { block ->
            val blockMap = block as? Map<*, *> ?: return@mapNotNull null
            val blockContent = blockMap["content"] as? List<*> ?: return@mapNotNull null
            blockContent.mapNotNull { item ->
                (item as? Map<*, *>)?.get("text") as? String
            }.joinToString("")
        }.joinToString("\n")
    }
}

