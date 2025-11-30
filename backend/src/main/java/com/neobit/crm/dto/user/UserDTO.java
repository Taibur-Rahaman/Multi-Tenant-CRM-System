package com.neobit.crm.dto.user;

import com.neobit.crm.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    
    private UUID id;
    private UUID tenantId;
    private String tenantName;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private User.UserRole role;
    private Boolean isActive;
    private Boolean emailVerified;
    private Instant lastLoginAt;
    private Instant createdAt;
}

