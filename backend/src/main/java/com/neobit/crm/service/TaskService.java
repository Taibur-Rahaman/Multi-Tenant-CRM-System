package com.neobit.crm.service;

import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.task.CreateTaskRequest;
import com.neobit.crm.dto.task.TaskDTO;
import com.neobit.crm.entity.*;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.mapper.TaskMapper;
import com.neobit.crm.repository.*;
import com.neobit.crm.security.TenantContext;
import com.neobit.crm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final InteractionRepository interactionRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    
    public PageResponse<TaskDTO> getTasks(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Task> page = taskRepository.findByTenantId(tenantId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(taskMapper::toDTO).toList());
    }
    
    public TaskDTO getTaskById(UUID taskId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Task task = taskRepository.findByIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        return taskMapper.toDTO(task);
    }
    
    public PageResponse<TaskDTO> getTasksByStatus(String status, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Task> page = taskRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        return PageResponse.of(page, page.getContent().stream().map(taskMapper::toDTO).toList());
    }
    
    public PageResponse<TaskDTO> getMyTasks(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        Page<Task> page = taskRepository.findByTenantIdAndAssignedTo(tenantId, currentUser.getId(), pageable);
        return PageResponse.of(page, page.getContent().stream().map(taskMapper::toDTO).toList());
    }
    
    public List<TaskDTO> getOverdueTasks() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return taskRepository.findOverdueTasks(tenantId, Instant.now())
                .stream().map(taskMapper::toDTO).toList();
    }
    
    @Transactional
    public TaskDTO createTask(CreateTaskRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));
        
        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User createdBy = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));
        
        Task task = Task.builder()
                .tenant(tenant)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : "medium")
                .dueDate(request.getDueDate())
                .createdBy(createdBy)
                .tags(request.getTags())
                .build();
        
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
            task.setCustomer(customer);
        }
        
        if (request.getAccountId() != null) {
            Account account = accountRepository.findByIdAndTenantId(request.getAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));
            task.setAccount(account);
        }
        
        if (request.getInteractionId() != null) {
            Interaction interaction = interactionRepository.findByIdAndTenantId(request.getInteractionId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Interaction", "id", request.getInteractionId()));
            task.setInteraction(interaction);
        }
        
        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            task.setAssignedTo(assignedTo);
        } else {
            task.setAssignedTo(createdBy);
        }
        
        return taskMapper.toDTO(taskRepository.save(task));
    }
    
    @Transactional
    public TaskDTO updateTask(UUID taskId, CreateTaskRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Task task = taskRepository.findByIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        
        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getTags() != null) task.setTags(request.getTags());
        
        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            task.setAssignedTo(assignedTo);
        }
        
        return taskMapper.toDTO(taskRepository.save(task));
    }
    
    @Transactional
    public TaskDTO completeTask(UUID taskId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Task task = taskRepository.findByIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        
        task.setStatus("completed");
        task.setCompletedAt(Instant.now());
        
        return taskMapper.toDTO(taskRepository.save(task));
    }
    
    @Transactional
    public void deleteTask(UUID taskId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Task task = taskRepository.findByIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        taskRepository.delete(task);
    }
}

