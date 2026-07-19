package com.bugtracker.bugtracker.controller;

import com.bugtracker.bugtracker.dto.StatsDevResponse;
import com.bugtracker.bugtracker.dto.StatsReporterResponse;
import com.bugtracker.bugtracker.service.StatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@Log4j2
public class StatsController {

    private final StatsService statsService;
    private final com.bugtracker.bugtracker.repository.UserRepository userRepository;

    @GetMapping("/reporter/me")
    public ResponseEntity<StatsReporterResponse> getMyReporterStats(java.security.Principal principal) {
        log.info("Récupération des statistiques étendues pour le reporter : {}", principal.getName());
        com.bugtracker.bugtracker.entity.User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return ResponseEntity.ok(statsService.getReporterStats(user.getId()));
    }

    @GetMapping("/dev/me")
    public ResponseEntity<StatsDevResponse> getMyDevStats(java.security.Principal principal) {
        log.info("Récupération des statistiques étendues pour le dev : {}", principal.getName());
        com.bugtracker.bugtracker.entity.User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return ResponseEntity.ok(statsService.getDevStats(user.getId()));
    }
}
