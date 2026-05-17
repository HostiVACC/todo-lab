package com.example.todolab.controller;

import com.example.todolab.dto.AuthResponse;
import com.example.todolab.dto.LoginRequest;
import com.example.todolab.dto.RegisterRequest;
import com.example.todolab.dto.UserResponse;
import com.example.todolab.mapper.ApiMapper;
import com.example.todolab.security.AuthenticatedUser;
import com.example.todolab.service.CurrentUserService;
import com.example.todolab.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final ApiMapper apiMapper;
    private final CurrentUserService currentUserService;

    public AuthController(UserService userService,
                          AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository,
                          ApiMapper apiMapper,
                          CurrentUserService currentUserService) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.apiMapper = apiMapper;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                              HttpServletRequest httpRequest,
                              HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        return apiMapper.toAuthResponse(userService.findUserEntity(principal.getId()));
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletRequest request,
                                      HttpServletResponse response,
                                      Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return Map.of("message", "Logged out successfully");
    }

    @GetMapping("/me")
    public UserResponse me() {
        return apiMapper.toUserResponse(userService.findUserEntity(currentUserService.getCurrentUserId()));
    }
}
