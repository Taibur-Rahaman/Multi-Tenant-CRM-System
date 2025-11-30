package com.neobit.crm.dto.user;

import com.neobit.crm.entity.User;
import lombok.Data;

@Data
public class UpdateUserRequest {
    
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private User.UserRole role;
    private Boolean isActive;
}

