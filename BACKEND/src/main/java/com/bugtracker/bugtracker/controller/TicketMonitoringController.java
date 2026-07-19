package com.bugtracker.bugtracker.controller;

import com.bugtracker.bugtracker.dto.TicketMonitoringDto;
import com.bugtracker.bugtracker.service.TicketMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/monitoring")
@RequiredArgsConstructor
@Log4j2
public class TicketMonitoringController {

    private final TicketMonitoringService monitoringService;

    /** GET /api/monitoring  — tous les tickets (admin) */
    @GetMapping
    public ResponseEntity<List<TicketMonitoringDto>> getAll() {
        return ResponseEntity.ok(monitoringService.getAll());
    }

    /** GET /api/monitoring/delayed  — tickets en retard SLA */
    @GetMapping("/delayed")
    public ResponseEntity<List<TicketMonitoringDto>> getDelayed() {
        return ResponseEntity.ok(monitoringService.getDelayed());
    }

    /**
     * GET /api/monitoring/my
     * Monitoring des tickets soumis par le reporter connecte.
     * La vue est calculee en temps reel (PostgreSQL NOW()), donc toujours a jour.
     */
    @GetMapping("/my")
    public ResponseEntity<List<TicketMonitoringDto>> getMy(Principal principal) {
        return ResponseEntity.ok(monitoringService.getByReporterEmail(principal.getName()));
    }

    /** GET /api/monitoring/{ticketId}  — monitoring d'un ticket precis */
    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketMonitoringDto> getByTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(monitoringService.getByTicketId(ticketId));
    }
}