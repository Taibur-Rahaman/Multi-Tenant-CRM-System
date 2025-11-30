package com.neobit.crm.service;

import com.neobit.crm.dto.user.UpdateUserRequest;
import com.neobit.crm.dto.user.UserDTO;
import com.neobit.crm.entity.User;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.mapper.UserMapper;
import com.neobit.crm.repository.UserRepository;
import com.neobit.crm.security.TenantContext;
import com.neobit.crm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return UserPrincipal.create(user);
    }
    
    public UserDetails loadUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return UserPrincipal.create(user);
    }
    
    public UserDTO getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return userMapper.toDTO(user);
    }
    
    public Page<UserDTO> getUsersByTenant(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return userRepository.findByTenantId(tenantId, pageable)
                .map(userMapper::toDTO);
    }
    
    @Transactional
    public UserDTO updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getIsActive() != null) user.setIsActive(request.getIsActive());
        
        return userMapper.toDTO(userRepository.save(user));
    }
    
    @Transactional
    public void deleteUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        userRepository.deleteById(userId);
    }
}

