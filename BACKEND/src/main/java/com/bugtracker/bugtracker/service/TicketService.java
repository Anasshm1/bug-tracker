package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.dto.TicketRequest;
import com.bugtracker.bugtracker.dto.TicketResponse;
import com.bugtracker.bugtracker.entity.Project;
import com.bugtracker.bugtracker.entity.Role;
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

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.time.LocalDateTime;
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
     * Retourne les tickets visibles par l'utilisateur connecté.
     * - REPORTER : uniquement ses propres tickets (reporter_id == currentUser.id)
     * - DEV      : uniquement les tickets qui lui sont assignés (assigned_to_id == currentUser.id)
     */
    public List<TicketResponse> getAllTickets(User currentUser) {
        Specification<Ticket> spec = buildRoleSpec(currentUser);
        return ticketRepository.findAll(spec)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retourne un ticket par son ID.
     */
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable avec l'ID : " + id));
        return mapToResponse(ticket);
    }

    /**
     * Met à jour le statut d'un ticket selon le rôle de l'utilisateur.
     * - DEV      : peut passer en ACCEPTE ou RETOUR_INFO
     * - REPORTER : peut passer en COMPLETE uniquement
     */
    public TicketResponse updateTicketStatus(Long ticketId, String newStatus, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable avec l'ID : " + ticketId));

        if (currentUser.getRole() == Role.DEV) {
            if (!newStatus.equals("ACCEPTE") && !newStatus.equals("RETOUR_INFO") && !newStatus.equals("TRAITE")) {
                throw new RuntimeException("Un développeur ne peut définir que le statut ACCEPTE, RETOUR_INFO ou TRAITE.");
            }
            // Vérifier que le ticket lui est bien assigné
            if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Vous n'êtes pas assigné à ce ticket.");
            }
        } else if (currentUser.getRole() == Role.REPORTER) {
            if (!newStatus.equals("COMPLETE")) {
                throw new RuntimeException("Un reporter ne peut définir que le statut COMPLETE.");
            }
            // Vérifier que c'est bien son ticket
            if (!ticket.getReporter().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Vous n'êtes pas le reporter de ce ticket.");
            }
        } else {
            throw new RuntimeException("Rôle non autorisé à modifier le statut.");
        }

        ticket.setStatus(newStatus);
        ticketRepository.save(ticket);
        log.info("Statut du ticket #{} mis à {} par {}", ticketId, newStatus, currentUser.getEmail());
        return mapToResponse(ticket);
    }


    /**
     * Recherche de tickets avec filtres optionnels + restriction de rôle obligatoire.
     */
    public List<TicketResponse> searchTickets(String title, Long projectId, Long assignedToId, Long reporterId,
                                               LocalDateTime dateDebut, LocalDateTime dateFin, User currentUser) {

        LocalDateTime adjustedDateFin = dateFin != null
                ? dateFin.toLocalDate().atTime(java.time.LocalTime.MAX)
                : null;

        String searchTitle = (title == null || title.trim().isEmpty()) ? null : title.trim();

        // Condition de rôle (toujours forcée)
        Specification<Ticket> roleSpec = buildRoleSpec(currentUser);

        // Filtres optionnels de recherche
        Specification<Ticket> filterSpec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (searchTitle != null) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + searchTitle.toLowerCase() + "%"));
            }
            if (projectId != null) {
                predicates.add(cb.equal(root.get("project").get("id"), projectId));
            }
            // N'autoriser le filtre assignedToId que pour les non-DEV (pour DEV, déjà forcé par roleSpec)
            if (assignedToId != null && currentUser.getRole() != Role.DEV) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }
            // N'autoriser le filtre reporterId que pour les non-REPORTER (pour REPORTER, déjà forcé par roleSpec)
            if (reporterId != null && currentUser.getRole() != Role.REPORTER) {
                predicates.add(cb.equal(root.get("reporter").get("id"), reporterId));
            }
            if (dateDebut != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateDebut));
            }
            if (adjustedDateFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), adjustedDateFin));
            }

            if (query != null) query.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Combine : role_condition AND filtres_optionnels
        Specification<Ticket> combined = roleSpec.and(filterSpec);

        return ticketRepository.findAll(combined)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retourne les statistiques : nombre de tickets par statut (filtrés selon le rôle).
     */
    public Map<String, Long> getTicketStats(User currentUser) {
        Specification<Ticket> spec = buildRoleSpec(currentUser);
        List<Ticket> tickets = ticketRepository.findAll(spec);

        Map<String, Long> stats = new java.util.HashMap<>(tickets.stream()
                .collect(Collectors.groupingBy(Ticket::getStatus, Collectors.counting())));

        // S'assurer que tous les statuts sont présents, même à 0
        stats.putIfAbsent("NOUVEAU", 0L);
        stats.putIfAbsent("EN_COURS", 0L);
        stats.putIfAbsent("RESOLU", 0L);

        log.info("Statistiques calculées pour {} : {}", currentUser.getEmail(), stats);
        return stats;
    }

    /**
     * Construit la Specification de restriction de rôle :
     * - REPORTER : reporter_id == currentUser.id
     * - DEV      : assigned_to_id == currentUser.id
     */
    private Specification<Ticket> buildRoleSpec(User currentUser) {
        return (root, query, cb) -> {
            if (currentUser.getRole() == Role.REPORTER) {
                return cb.equal(root.get("reporter").get("id"), currentUser.getId());
            } else if (currentUser.getRole() == Role.DEV) {
                return cb.equal(root.get("assignedTo").get("id"), currentUser.getId());
            }
            return cb.conjunction(); // admin ou autres rôles : tout voir
        };
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
