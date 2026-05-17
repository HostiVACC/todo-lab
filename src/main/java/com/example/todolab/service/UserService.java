package com.example.todolab.service;

import com.example.todolab.dto.RegisterRequest;
import com.example.todolab.dto.UserResponse;
import com.example.todolab.dto.UserUpdateRequest;
import com.example.todolab.entity.RoleEntity;
import com.example.todolab.entity.RoleName;
import com.example.todolab.entity.UserEntity;
import com.example.todolab.exception.BadRequestException;
import com.example.todolab.exception.NotFoundException;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.repository.RoleRepository;
import com.example.todolab.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApiMapper apiMapper;
    private final CurrentUserService currentUserService;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       ApiMapper apiMapper,
                       CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.apiMapper = apiMapper;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("User with this email already exists");
        }

        RoleEntity userRole = roleRepository.findByName(RoleName.USER)
            .orElseThrow(() -> new NotFoundException("Default USER role was not found"));

        UserEntity user = new UserEntity();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setEnabled(true);
        user.getRoles().add(userRole);

        return apiMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(apiMapper::toUserResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        return apiMapper.toUserResponse(findUserEntity(id));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        return apiMapper.toUserResponse(currentUserService.getCurrentUserEntity());
    }

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        UserEntity user = findUserEntity(id);
        user.setDisplayName(request.displayName().trim());
        user.setEnabled(request.enabled());
        user.setRoles(resolveRoles(request.roleNames()));
        return apiMapper.toUserResponse(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (currentUserService.getCurrentUserId().equals(id)) {
            throw new BadRequestException("You cannot delete the currently authenticated user");
        }
        userRepository.delete(findUserEntity(id));
    }

    @Transactional(readOnly = true)
    public UserEntity findUserEntity(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("User with id " + id + " was not found"));
    }

    private Set<RoleEntity> resolveRoles(Set<RoleName> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            throw new BadRequestException("At least one role is required");
        }

        return roleNames.stream()
            .map(roleName -> roleRepository.findByName(roleName)
                .orElseThrow(() -> new NotFoundException("Role " + roleName + " was not found")))
            .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }
}
