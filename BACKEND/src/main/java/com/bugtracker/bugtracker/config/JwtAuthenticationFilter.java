package com.bugtracker.bugtracker.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Log4j2
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Pas de token → laisse passer (Spring Security bloquera si route protégée)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("Requête sans token JWT : {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        // Retire "Bearer " pour extraire uniquement le token
        jwt = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwt);

        // Email trouvé ET utilisateur pas encore authentifié dans ce contexte
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                // Connecte l'utilisateur pour cette requête
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.info("Utilisateur authentifié via JWT : {}", userEmail);
            } else {
                log.warn("Token JWT invalide pour la requête : {}", request.getRequestURI());
            }
        }
        filterChain.doFilter(request, response);
    }
}
