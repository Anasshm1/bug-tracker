package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.config.JwtService;
import com.bugtracker.bugtracker.dto.AuthResponse;
import com.bugtracker.bugtracker.dto.LoginRequest;
import com.bugtracker.bugtracker.dto.RegisterRequest;
import com.bugtracker.bugtracker.entity.Role;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // --- Inscription ---
    public AuthResponse register(RegisterRequest request) {
        
        // 1. Vérifie si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Tentative d'inscription avec un email déjà existant : {}", request.getEmail());
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        // 2. Convertit le rôle texte ("REPORTER" ou "DEV") en Enum
        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Rôle invalide fourni : {}", request.getRole());
            throw new RuntimeException("Le rôle doit être REPORTER ou DEV");
        }

        // 3. Crée l'objet User avec le Builder de Lombok
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // On HASHE le mot de passe !
                .role(role)
                .build();

        // 4. Sauvegarde dans la base de données
        userRepository.save(user);
        log.info("Nouvel utilisateur inscrit avec succès : {} (Rôle: {})", user.getEmail(), user.getRole());

        // 5. Génère le JWT
        String jwtToken = jwtService.generateToken(user);

        // 6. Construit la réponse pour le Frontend
        return AuthResponse.builder()
                .token(jwtToken)
                .user(mapToUserDto(user))
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    // --- Connexion ---
    public AuthResponse login(LoginRequest request) {
        
        // 1. Spring Security vérifie l'email et le mot de passe
        // S'ils sont faux, ça lève une exception (403 Forbidden) automatiquement
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Si on arrive ici, le mot de passe est bon ! On récupère l'utilisateur en BDD
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        log.info("Connexion réussie pour l'utilisateur : {}", user.getEmail());

        // 3. On génère un nouveau token JWT
        String token = jwtService.generateToken(user);

        // 4. On renvoie les infos au Frontend
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserDto(user))
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public List<AuthResponse.UserDto> getDevelopers() {
        return userRepository.findByRole(Role.DEV).stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    public List<AuthResponse.UserDto> getReporters() {
        return userRepository.findByRole(Role.REPORTER).stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    private AuthResponse.UserDto mapToUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
