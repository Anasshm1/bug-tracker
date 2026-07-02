package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.config.JwtService;
import com.bugtracker.bugtracker.dto.AuthResponse;
import com.bugtracker.bugtracker.dto.LoginRequest;
import com.bugtracker.bugtracker.dto.RegisterRequest;
import com.bugtracker.bugtracker.entity.Role;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFullName("Test User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setRole("REPORTER");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
    }

    @Test
    void registerShouldCreateUserAndReturnAuthResponse() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encoded-password");
        when(jwtService.generateToken(any(User.class))).thenReturn("fake-jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("fake-jwt-token", response.getToken());
        assertEquals(registerRequest.getEmail(), response.getEmail());
        assertEquals(registerRequest.getFullName(), response.getFullName());
        assertEquals("REPORTER", response.getRole());

        verify(userRepository).save(any(User.class));
    }

    @Test
    void loginShouldAuthenticateAndReturnAuthResponse() {
        User user = User.builder()
                .email(loginRequest.getEmail())
                .password("encoded-password")
                .fullName("Test User")
                .role(Role.DEV)
                .build();

        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(user));
        doNothing().when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        when(jwtService.generateToken(eq(user))).thenReturn("fake-jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("fake-jwt-token", response.getToken());
        assertEquals(user.getEmail(), response.getEmail());
        assertEquals(user.getFullName(), response.getFullName());
        assertEquals("DEV", response.getRole());
    }

    @Test
    void registerShouldFailWhenEmailAlreadyExists() {
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
        assertEquals("Cet email est déjà utilisé", exception.getMessage());
    }
}
