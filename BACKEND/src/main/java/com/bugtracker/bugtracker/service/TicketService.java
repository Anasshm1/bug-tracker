package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.dto.TicketRequest;
import com.bugtracker.bugtracker.dto.TicketResponse;
import com.bugtracker.bugtracker.entity.Project;
import com.bugtracker.bugtracker.entity.Ticket;
import com.bugtracker.bugtracker.entity.TicketAttachment;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.ProjectRepository;
import com.bugtracker.bugtracker.repository.TicketAttachmentRepository;
import com.bugtracker.bugtracker.repository.TicketRepository;
import com.bugtracker.bugtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class TicketService {
    private final TicketRepository ticketRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final TicketAttachmentRepository ticketAttachmentRepository;

    /**
     * Crée un nouveau ticket lié au reporter connecté.
     */
    public TicketResponse createTicket(TicketRequest request, List<MultipartFile> files, User reporter) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Projet introuvable"));

        if (!"ENCOURS".equals(project.getStatus())) {
            throw new RuntimeException("Impossible de créer un ticket : le projet n'est pas en cours.");
        }

        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur assigné introuvable"));
        }

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .level(request.getLevel())
                .project(project)
                .assignedTo(assignedTo)
                .reporter(reporter)
                .build();

        ticketRepository.save(ticket);
        
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String fileName = fileStorageService.storeFile(file);
                TicketAttachment attachment = TicketAttachment.builder()
                        .fileName(file.getOriginalFilename())
                        .filePath("/uploads/" + fileName)
                        .fileType(file.getContentType())
                        .ticket(ticket)
                        .build();
                ticketAttachmentRepository.save(attachment);
                ticket.getAttachments().add(attachment);
            }
        }

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
                .level(ticket.getLevel())
                .projectId(ticket.getProject() != null ? ticket.getProject().getId() : null)
                .projectName(ticket.getProject() != null ? ticket.getProject().getName() : null)
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getFullName() : null)
                .attachments(ticket.getAttachments() != null ? 
                        ticket.getAttachments().stream().map(TicketAttachment::getFilePath).collect(Collectors.toList()) : null)
                .build();
    }
}
