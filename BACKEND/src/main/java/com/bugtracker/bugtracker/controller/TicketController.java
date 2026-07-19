package com.bugtracker.bugtracker.controller;

import com.bugtracker.bugtracker.dto.CommentResponse;
import com.bugtracker.bugtracker.dto.TicketRequest;
import com.bugtracker.bugtracker.dto.TicketResponse;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.service.CommentService;
import com.bugtracker.bugtracker.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Log4j2
public class TicketController {

    private final TicketService ticketService;
    private final CommentService commentService;

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
    public ResponseEntity<List<TicketResponse>> getAllTickets(@AuthenticationPrincipal User currentUser) {
        log.info("Récupération de tous les tickets pour l'utilisateur {}", currentUser.getEmail());
        List<TicketResponse> tickets = ticketService.getAllTickets(currentUser);
        return ResponseEntity.ok(tickets);
    }

    /**
     * GET /api/tickets/search — Recherche de tickets avec filtres optionnels
     */
    @GetMapping("/search")
    public ResponseEntity<List<TicketResponse>> searchTickets(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long reporterId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @AuthenticationPrincipal User currentUser) {

        log.info("Recherche tickets par {} — title={}, projectId={}, assignedToId={}, reporterId={}, dateDebut={}, dateFin={}",
                currentUser.getEmail(), title, projectId, assignedToId, reporterId, dateDebut, dateFin);

        LocalDateTime dateDebutTime = dateDebut != null ? dateDebut.atStartOfDay() : null;
        LocalDateTime dateFinTime = dateFin != null ? dateFin.atTime(LocalTime.MAX) : null;

        List<TicketResponse> results = ticketService.searchTickets(title, projectId, assignedToId, reporterId, dateDebutTime, dateFinTime, currentUser);
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/tickets/stats — Statistiques des tickets par statut
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getTicketStats(@AuthenticationPrincipal User currentUser) {
        log.info("Récupération des statistiques pour l'utilisateur {}", currentUser.getEmail());
        Map<String, Long> stats = ticketService.getTicketStats(currentUser);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/tickets/{id} — Récupérer un ticket par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
        log.info("Récupération du ticket #{}", id);
        TicketResponse ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    /**
     * PATCH /api/tickets/{id}/status — Mettre à jour le statut d'un ticket
     * - DEV      : ACCEPTE ou RETOUR_INFO
     * - REPORTER : COMPLETE
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        log.info("Mise à jour statut ticket #{} -> {} par {}", id, newStatus, currentUser.getEmail());
        TicketResponse response = ticketService.updateTicketStatus(id, newStatus, currentUser);
        return ResponseEntity.ok(response);
    }


    /**
     * GET /api/tickets/{id}/comments — Lister les commentaires d'un ticket
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        log.info("Récupération des commentaires du ticket #{}", id);
        List<CommentResponse> comments = commentService.getCommentsByTicket(id);
        return ResponseEntity.ok(comments);
    }

    /**
     * POST /api/tickets/{id}/comments — Ajouter un commentaire à un ticket
     */
    @PostMapping(value = "/{id}/comments", consumes = {"multipart/form-data"})
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @RequestPart("content") String content,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal User currentUser) {

        log.info("Ajout commentaire au ticket #{} par {}", id, currentUser.getEmail());
        CommentResponse response = commentService.addComment(id, content, files, currentUser);
        return ResponseEntity.ok(response);
    }
}

