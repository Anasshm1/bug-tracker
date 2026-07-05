package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.dto.TicketRequest;
import com.bugtracker.bugtracker.dto.TicketResponse;
import com.bugtracker.bugtracker.entity.Ticket;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class TicketService {

    private final TicketRepository ticketRepository;

    /**
     * Crée un nouveau ticket lié au reporter connecté.
     */
    public TicketResponse createTicket(TicketRequest request, User reporter) {
        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .reporter(reporter)
                .build();

        ticketRepository.save(ticket);
        log.info("Ticket créé par {} : {}", reporter.getEmail(), ticket.getTitle());

        return mapToResponse(ticket);
    }

    /**
     * Retourne tous les tickets.
     */
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retourne les statistiques : nombre de tickets par statut.
     */
    public Map<String, Long> getTicketStats() {
        List<Ticket> tickets = ticketRepository.findAll();

        Map<String, Long> stats = tickets.stream()
                .collect(Collectors.groupingBy(Ticket::getStatus, Collectors.counting()));

        // S'assurer que tous les statuts sont présents, même à 0
        stats.putIfAbsent("NOUVEAU", 0L);
        stats.putIfAbsent("EN_COURS", 0L);
        stats.putIfAbsent("RESOLU", 0L);

        log.info("Statistiques calculées : {}", stats);
        return stats;
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .reporterName(ticket.getReporter().getFullName())
                .reporterEmail(ticket.getReporter().getEmail())
                .build();
    }
}
