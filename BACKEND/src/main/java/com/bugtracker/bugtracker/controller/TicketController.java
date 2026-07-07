package com.bugtracker.bugtracker.controller;

import com.bugtracker.bugtracker.dto.TicketRequest;
import com.bugtracker.bugtracker.dto.TicketResponse;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Log4j2
public class TicketController {

    private final TicketService ticketService;

    /**
     * POST /api/tickets — Créer un ticket (REPORTER uniquement)
     */
    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('REPORTER')")
    public ResponseEntity<TicketResponse> createTicket(
            @RequestPart("ticket") @Valid TicketRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User currentUser) {

        log.info("Création de ticket par {} : {}", currentUser.getEmail(), request.getTitle());
        TicketResponse response = ticketService.createTicket(request, files, currentUser);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/tickets — Lister tous les tickets (DEV + REPORTER)
     */
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        log.info("Récupération de tous les tickets");
        List<TicketResponse> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(tickets);
    }

    /**
     * GET /api/tickets/stats — Statistiques des tickets par statut
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getTicketStats() {
        log.info("Récupération des statistiques");
        Map<String, Long> stats = ticketService.getTicketStats();
        return ResponseEntity.ok(stats);
    }
}
