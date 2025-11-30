package com.neobit.crm.controller;

import com.neobit.crm.dto.common.ApiResponse;
import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.task.CreateTaskRequest;
import com.neobit.crm.dto.task.TaskDTO;
import com.neobit.crm.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management endpoints")
public class TaskController {
    
    private final TaskService taskService;
    
    @GetMapping
    @Operation(summary = "Get all tasks")
    public ResponseEntity<ApiResponse<PageResponse<TaskDTO>>> getTasks(Pageable pageable) {
        PageResponse<TaskDTO> tasks = taskService.getTasks(pageable);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<ApiResponse<TaskDTO>> getTaskById(@PathVariable UUID id) {
        TaskDTO task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.success(task));
    }
    
    @GetMapping("/my-tasks")
    @Operation(summary = "Get tasks assigned to current user")
    public ResponseEntity<ApiResponse<PageResponse<TaskDTO>>> getMyTasks(Pageable pageable) {
        PageResponse<TaskDTO> tasks = taskService.getMyTasks(pageable);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Get tasks by status")
    public ResponseEntity<ApiResponse<PageResponse<TaskDTO>>> getTasksByStatus(
            @PathVariable String status,
            Pageable pageable) {
        PageResponse<TaskDTO> tasks = taskService.getTasksByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
    
    @GetMapping("/overdue")
    @Operation(summary = "Get overdue tasks")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getOverdueTasks() {
        List<TaskDTO> tasks = taskService.getOverdueTasks();
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
    
    @PostMapping
    @Operation(summary = "Create a new task")
    public ResponseEntity<ApiResponse<TaskDTO>> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskDTO task = taskService.createTask(request);
        return ResponseEntity.ok(ApiResponse.success("Task created successfully", task));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update task")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTaskRequest request) {
        TaskDTO task = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", task));
    }
    
    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark task as completed")
    public ResponseEntity<ApiResponse<TaskDTO>> completeTask(@PathVariable UUID id) {
        TaskDTO task = taskService.completeTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task completed successfully", task));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete task")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }
}

