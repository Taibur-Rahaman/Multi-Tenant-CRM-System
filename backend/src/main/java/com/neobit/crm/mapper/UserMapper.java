package com.neobit.crm.mapper;

import com.neobit.crm.dto.user.UserDTO;
import com.neobit.crm.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    
    public UserDTO toDTO(User user) {
        if (user == null) return null;
        
        return UserDTO.builder()
                .id(user.getId())
                .tenantId(user.getTenant().getId())
                .tenantName(user.getTenant().getName())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .emailVerified(user.getEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

