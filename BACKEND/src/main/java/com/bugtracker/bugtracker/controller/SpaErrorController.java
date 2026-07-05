package com.bugtracker.bugtracker.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaErrorController implements ErrorController {

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        Integer statusCode = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
        String requestUri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
        
        // Si la ressource n'est pas trouvée (404)
        if (statusCode != null && statusCode == 404) {
            // Si c'est une route de l'API qui n'existe pas, on renvoie vraiment 404
            if (requestUri != null && requestUri.startsWith("/api/")) {
                return ResponseEntity.notFound().build();
            }
            // Sinon, on laisse le frontend (React Router) s'occuper de la route
            return "forward:/index.html";
        }
        
        // Pour les autres erreurs (500, 401, etc), on laisse le statut tel quel
        return ResponseEntity.status(statusCode != null ? statusCode : 500).build();
    }
}
