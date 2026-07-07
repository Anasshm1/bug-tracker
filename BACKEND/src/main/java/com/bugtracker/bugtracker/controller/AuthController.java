package com.bugtracker.bugtracker.controller;

import com.bugtracker.bugtracker.dto.AuthResponse;
import com.bugtracker.bugtracker.dto.LoginRequest;
import com.bugtracker.bugtracker.dto.RegisterRequest;
import com.bugtracker.bugtracker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth") // Toutes les routes ici commenceront par /api/auth
@RequiredArgsConstructor
@Log4j2
public class AuthController {

    private final AuthService authService;

    // Route : POST http://localhost:8080/api/auth/register
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Requête reçue : /api/auth/register pour l'email {}", request.getEmail());
        
        // On délègue tout le travail au AuthService
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    // Route : POST http://localhost:8080/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Requête reçue : /api/auth/login pour l'email {}", request.getEmail());
        
        // On délègue tout le travail au AuthService
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/developers")
    public ResponseEntity<List<AuthResponse.UserDto>> getDevelopers() {
        return ResponseEntity.ok(authService.getDevelopers());
    }
}
