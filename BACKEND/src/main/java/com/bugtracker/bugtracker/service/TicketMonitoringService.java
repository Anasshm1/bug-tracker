package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.dto.TicketMonitoringDto;
import com.bugtracker.bugtracker.entity.Ticket;
import com.bugtracker.bugtracker.entity.TicketMonitoring;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.TicketMonitoringRepository;
import com.bugtracker.bugtracker.repository.TicketRepository;
import com.bugtracker.bugtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class TicketMonitoringService {

    private final TicketMonitoringRepository monitoringRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    /** Tous les tickets (admin) */
    public List<TicketMonitoringDto> getAll() {
        return monitoringRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Tickets en retard SLA */
    public List<TicketMonitoringDto> getDelayed() {
        return monitoringRepository.findByAlert("Retard").stream().map(this::toDto).collect(Collectors.toList());
    }

    /** Monitoring d'un ticket precis */
    public TicketMonitoringDto getByTicketId(Long ticketId) {
        return monitoringRepository.findByTicketId(ticketId)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Ticket #" + ticketId + " introuvable dans le monitoring"));
    }

    /**
     * Monitoring des tickets soumis par le reporter connecte (email).
     * La vue SQL ne contient pas reporter_id, donc on recupere d'abord
     * la liste des ticket IDs du reporter, puis on filtre le monitoring.
     */
    public List<TicketMonitoringDto> getByReporterEmail(String email) {
        User reporter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + email));

        List<Long> ticketIds = ticketRepository.findByReporter(reporter)
                .stream()
                .map(Ticket::getId)
                .collect(Collectors.toList());

        if (ticketIds.isEmpty()) return List.of();

        return monitoringRepository.findByTicketIdIn(ticketIds)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── Mapping ────────────────────────────────────────────────────
    private TicketMonitoringDto toDto(TicketMonitoring m) {
        return TicketMonitoringDto.builder()
                .ticketId(m.getTicketId())
                .status(m.getStatus())
                .statusDate(m.getStatusDate())
                .daysInStatus(m.getDaysInStatus())
                .alert(m.getAlert())
                .build();
    }
}