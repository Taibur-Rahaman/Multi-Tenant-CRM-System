package com.neobit.crm.integration.linear

import com.fasterxml.jackson.databind.ObjectMapper
import com.neobit.crm.repository.IntegrationConfigRepository
import org.slf4j.LoggerFactory
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.util.*

data class LinearIssue(
    val id: String,
    val identifier: String,
    val title: String,
    val description: String?,
    val state: String,
    val priority: Int, // 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
    val assignee: String?,
    val labels: List<String>,
    val url: String,
    val createdAt: String,
    val updatedAt: String
)

data class CreateLinearIssueRequest(
    val teamId: String,
    val title: String,
    val description: String? = null,
    val priority: Int = 3, // Medium by default
    val labelIds: List<String> = emptyList(),
    val assigneeId: String? = null
)

data class UpdateLinearIssueRequest(
    val title: String? = null,
    val description: String? = null,
    val priority: Int? = null,
    val stateId: String? = null
)

@Service
class LinearService(
    private val integrationConfigRepository: IntegrationConfigRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(LinearService::class.java)
    private val restTemplate = RestTemplate()
    private val graphqlUrl = "https://api.linear.app/graphql"
    
    data class LinearConfig(
        val apiKey: String,
        val teamId: String? = null
    )
    
    fun getLinearConfig(tenantId: UUID): LinearConfig? {
        val configEntity = integrationConfigRepository.findByTenantIdAndIntegrationType(
            tenantId, "linear"
        ).orElse(null) ?: return null
        
        if (configEntity.isEnabled != true) return null
        
        val configMap = configEntity.config ?: emptyMap()
        val credentialsMap = configEntity.credentials ?: emptyMap()
        
        return LinearConfig(
            apiKey = credentialsMap["apiKey"] as? String ?: return null,
            teamId = configMap["teamId"] as? String
        )
    }
    
    private fun createHeaders(config: LinearConfig): HttpHeaders {
        return HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            set("Authorization", config.apiKey)
        }
    }
    
    private fun executeGraphQL(config: LinearConfig, query: String, variables: Map<String, Any> = emptyMap()): Map<*, *>? {
        val body = mapOf(
            "query" to query,
            "variables" to variables
        )
        
        return try {
            val entity = HttpEntity(body, createHeaders(config))
            val response = restTemplate.postForEntity(graphqlUrl, entity, Map::class.java)
            response.body?.get("data") as? Map<*, *>
        } catch (e: Exception) {
            logger.error("Linear GraphQL request failed", e)
            null
        }
    }
    
    fun getIssues(tenantId: UUID, first: Int = 50): List<LinearIssue> {
        val config = getLinearConfig(tenantId) ?: return emptyList()
        
        val query = """
            query GetIssues(${'$'}first: Int!) {
                issues(first: ${'$'}first, orderBy: updatedAt) {
                    nodes {
                        id
                        identifier
                        title
                        description
                        state { name }
                        priority
                        assignee { name }
                        labels { nodes { name } }
                        url
                        createdAt
                        updatedAt
                    }
                }
            }
        """.trimIndent()
        
        val data = executeGraphQL(config, query, mapOf("first" to first)) ?: return emptyList()
        val issues = (data["issues"] as? Map<*, *>)?.get("nodes") as? List<*> ?: return emptyList()
        
        return issues.mapNotNull { parseIssue(it as? Map<*, *>) }
    }
    
    fun getIssuesByTeam(tenantId: UUID, teamId: String, first: Int = 50): List<LinearIssue> {
        val config = getLinearConfig(tenantId) ?: return emptyList()
        
        val query = """
            query GetTeamIssues(${'$'}teamId: String!, ${'$'}first: Int!) {
                team(id: ${'$'}teamId) {
                    issues(first: ${'$'}first, orderBy: updatedAt) {
                        nodes {
                            id
                            identifier
                            title
                            description
                            state { name }
                            priority
                            assignee { name }
                            labels { nodes { name } }
                            url
                            createdAt
                            updatedAt
                        }
                    }
                }
            }
        """.trimIndent()
        
        val data = executeGraphQL(config, query, mapOf("teamId" to teamId, "first" to first)) ?: return emptyList()
        val team = data["team"] as? Map<*, *> ?: return emptyList()
        val issues = (team["issues"] as? Map<*, *>)?.get("nodes") as? List<*> ?: return emptyList()
        
        return issues.mapNotNull { parseIssue(it as? Map<*, *>) }
    }
    
    fun getIssue(tenantId: UUID, issueId: String): LinearIssue? {
        val config = getLinearConfig(tenantId) ?: return null
        
        val query = """
            query GetIssue(${'$'}id: String!) {
                issue(id: ${'$'}id) {
                    id
                    identifier
                    title
                    description
                    state { name }
                    priority
                    assignee { name }
                    labels { nodes { name } }
                    url
                    createdAt
                    updatedAt
                }
            }
        """.trimIndent()
        
        val data = executeGraphQL(config, query, mapOf("id" to issueId)) ?: return null
        return parseIssue(data["issue"] as? Map<*, *>)
    }
    
    fun createIssue(tenantId: UUID, request: CreateLinearIssueRequest): LinearIssue? {
        val config = getLinearConfig(tenantId) ?: return null
        
        val query = """
            mutation CreateIssue(${'$'}teamId: String!, ${'$'}title: String!, ${'$'}description: String, ${'$'}priority: Int) {
                issueCreate(input: {
                    teamId: ${'$'}teamId
                    title: ${'$'}title
                    description: ${'$'}description
                    priority: ${'$'}priority
                }) {
                    success
                    issue {
                        id
                        identifier
                        title
                        description
                        state { name }
                        priority
                        assignee { name }
                        labels { nodes { name } }
                        url
                        createdAt
                        updatedAt
                    }
                }
            }
        """.trimIndent()
        
        val variables = mutableMapOf<String, Any>(
            "teamId" to request.teamId,
            "title" to request.title,
            "priority" to request.priority
        )
        request.description?.let { variables["description"] = it }
        
        val data = executeGraphQL(config, query, variables) ?: return null
        val issueCreate = data["issueCreate"] as? Map<*, *> ?: return null
        
        if (issueCreate["success"] != true) return null
        
        return parseIssue(issueCreate["issue"] as? Map<*, *>)
    }
    
    fun updateIssue(tenantId: UUID, issueId: String, request: UpdateLinearIssueRequest): LinearIssue? {
        val config = getLinearConfig(tenantId) ?: return null
        
        val inputFields = mutableListOf<String>()
        val variables = mutableMapOf<String, Any>("id" to issueId)
        
        request.title?.let {
            inputFields.add("title: \$title")
            variables["title"] = it
        }
        request.description?.let {
            inputFields.add("description: \$description")
            variables["description"] = it
        }
        request.priority?.let {
            inputFields.add("priority: \$priority")
            variables["priority"] = it
        }
        request.stateId?.let {
            inputFields.add("stateId: \$stateId")
            variables["stateId"] = it
        }
        
        if (inputFields.isEmpty()) return getIssue(tenantId, issueId)
        
        val variableDefs = mutableListOf("\$id: String!")
        if (request.title != null) variableDefs.add("\$title: String")
        if (request.description != null) variableDefs.add("\$description: String")
        if (request.priority != null) variableDefs.add("\$priority: Int")
        if (request.stateId != null) variableDefs.add("\$stateId: String")
        
        val query = """
            mutation UpdateIssue(${variableDefs.joinToString(", ")}) {
                issueUpdate(id: ${'$'}id, input: { ${inputFields.joinToString(", ")} }) {
                    success
                    issue {
                        id
                        identifier
                        title
                        description
                        state { name }
                        priority
                        assignee { name }
                        labels { nodes { name } }
                        url
                        createdAt
                        updatedAt
                    }
                }
            }
        """.trimIndent()
        
        val data = executeGraphQL(config, query, variables) ?: return null
        val issueUpdate = data["issueUpdate"] as? Map<*, *> ?: return null
        
        if (issueUpdate["success"] != true) return null
        
        return parseIssue(issueUpdate["issue"] as? Map<*, *>)
    }
    
    fun getTeams(tenantId: UUID): List<Map<String, String>> {
        val config = getLinearConfig(tenantId) ?: return emptyList()
        
        val query = """
            query GetTeams {
                teams {
                    nodes {
                        id
                        name
                        key
                    }
                }
            }
        """.trimIndent()
        
        val data = executeGraphQL(config, query) ?: return emptyList()
        val teams = (data["teams"] as? Map<*, *>)?.get("nodes") as? List<*> ?: return emptyList()
        
        return teams.mapNotNull { team ->
            val t = team as? Map<*, *> ?: return@mapNotNull null
            mapOf(
                "id" to (t["id"] as? String ?: return@mapNotNull null),
                "name" to (t["name"] as? String ?: ""),
                "key" to (t["key"] as? String ?: "")
            )
        }
    }
    
    fun getWorkflowStates(tenantId: UUID, teamId: String): List<Map<String, String>> {
        val config = getLinearConfig(tenantId) ?: return emptyList()
        
        val query = """
            query GetStates(${'$'}teamId: String!) {
                team(id: ${'$'}teamId) {
                    states {
                        nodes {
                            id
                            name
                            type
                        }
                    }
                }
            }
        """.trimIndent()
        
        val data = executeGraphQL(config, query, mapOf("teamId" to teamId)) ?: return emptyList()
        val team = data["team"] as? Map<*, *> ?: return emptyList()
        val states = (team["states"] as? Map<*, *>)?.get("nodes") as? List<*> ?: return emptyList()
        
        return states.mapNotNull { state ->
            val s = state as? Map<*, *> ?: return@mapNotNull null
            mapOf(
                "id" to (s["id"] as? String ?: return@mapNotNull null),
                "name" to (s["name"] as? String ?: ""),
                "type" to (s["type"] as? String ?: "")
            )
        }
    }
    
    private fun parseIssue(data: Map<*, *>?): LinearIssue? {
        if (data == null) return null
        
        val labelsNodes = (data["labels"] as? Map<*, *>)?.get("nodes") as? List<*>
        val labels = labelsNodes?.mapNotNull { label ->
            (label as? Map<*, *>)?.get("name") as? String
        } ?: emptyList()
        
        return LinearIssue(
            id = data["id"] as? String ?: return null,
            identifier = data["identifier"] as? String ?: "",
            title = data["title"] as? String ?: "",
            description = data["description"] as? String,
            state = (data["state"] as? Map<*, *>)?.get("name") as? String ?: "Unknown",
            priority = (data["priority"] as? Number)?.toInt() ?: 0,
            assignee = (data["assignee"] as? Map<*, *>)?.get("name") as? String,
            labels = labels,
            url = data["url"] as? String ?: "",
            createdAt = data["createdAt"] as? String ?: "",
            updatedAt = data["updatedAt"] as? String ?: ""
        )
    }
    
    companion object {
        fun priorityToString(priority: Int): String = when (priority) {
            0 -> "none"
            1 -> "urgent"
            2 -> "high"
            3 -> "medium"
            4 -> "low"
            else -> "medium"
        }
        
        fun stringToPriority(priority: String): Int = when (priority.lowercase()) {
            "urgent", "highest" -> 1
            "high" -> 2
            "medium" -> 3
            "low" -> 4
            "lowest", "none" -> 0
            else -> 3
        }
    }
}

