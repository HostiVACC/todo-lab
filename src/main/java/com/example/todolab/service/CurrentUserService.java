package com.example.todolab.service;

import com.example.todolab.entity.RoleName;
import com.example.todolab.entity.UserEntity;
import com.example.todolab.exception.ResourceAccessDeniedException;
import com.example.todolab.repository.UserRepository;
import com.example.todolab.security.AuthenticatedUser;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Long getCurrentUserId() {
        return getAuthenticatedPrincipal().getId();
    }

    public UserEntity getCurrentUserEntity() {
        Long id = getCurrentUserId();
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceAccessDeniedException("Authenticated user was not found"));
    }

    public boolean isAdmin() {
        return getCurrentUserEntity().getRoles().stream()
            .map(role -> role.getName())
            .anyMatch(RoleName.ADMIN::equals);
    }

    public AuthenticatedUser getAuthenticatedPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
            || !authentication.isAuthenticated()
            || authentication instanceof AnonymousAuthenticationToken
            || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new ResourceAccessDeniedException("Authentication is required");
        }
        return principal;
    }
}
