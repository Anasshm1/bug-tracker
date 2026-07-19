package com.bugtracker.bugtracker.config;

import com.bugtracker.bugtracker.entity.Project;
import com.bugtracker.bugtracker.entity.Role;
import com.bugtracker.bugtracker.entity.Ticket;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.ProjectRepository;
import com.bugtracker.bugtracker.repository.TicketRepository;
import com.bugtracker.bugtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Log4j2
public class DataSeeder implements CommandLineRunner {

    private final ProjectRepository projectRepository;
    private final UserRepository    userRepository;
    private final TicketRepository  ticketRepository;
    private final PasswordEncoder   passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // ── Projets ─────────────────────────────────────────────
        if (projectRepository.count() == 0) {
            projectRepository.save(new Project(null, "Projet Alpha", "ENCOURS"));
            projectRepository.save(new Project(null, "Projet Beta",  "ENCOURS"));
            projectRepository.save(new Project(null, "Projet Gamma", "ENCOURS"));
        }
        projectRepository.findAll().forEach(p -> {
            if ("Projet Beta".equals(p.getName()) && !"COMPLETE".equals(p.getStatus())) {
                p.setStatus("COMPLETE");
                projectRepository.save(p);
            }
        });

        // ── Données de test ───────────────────────────────────────
        boolean hasAcceptedTickets = ticketRepository.findAll().stream().anyMatch(t -> "ACCEPTE".equals(t.getStatus()));
        
        if (!hasAcceptedTickets) {
            log.info("DataSeeder : aucun ticket ACCEPTE trouvé, création de données de test pour anas5@bugtracker.com...");

            // Récupère les projets
            List<Project> projects = projectRepository.findAll();
            Project projetAlpha = projects.stream().filter(p -> "Projet Alpha".equals(p.getName())).findFirst().orElse(projects.get(0));
            Project projetGamma = projects.stream().filter(p -> "Projet Gamma".equals(p.getName())).findFirst().orElse(projects.get(0));

            // Récupère l'utilisateur existant (anas5)
            User testUser = userRepository.findByEmail("anas5@bugtracker.com").orElseGet(() -> {
                User u = User.builder()
                        .email("anas5@bugtracker.com")
                        .fullName("Anas Test")
                        .password(passwordEncoder.encode("Test1234!"))
                        .role(Role.REPORTER) // or DEV, doesn't matter for seeding tickets
                        .build();
                return userRepository.save(u);
            });
            
            // Et un dev supplémentaire (anas.dev)
            User dev = userRepository.findByEmail("anas.dev@bugtracker.com").orElseGet(() -> {
                User u = User.builder()
                        .email("anas.dev@bugtracker.com")
                        .fullName("Anas Dev")
                        .password(passwordEncoder.encode("Test1234!"))
                        .role(Role.DEV)
                        .build();
                return userRepository.save(u);
            });

            // ── Tickets avec le statut ACCEPTE (pour que le ranking fonctionne) ──
            // testUser est le reporter et dev est l'assigné
            createTicket("Bug critique UI", "Le bouton ne marche pas", "ACCEPTE", "URGENT", testUser, dev, projetAlpha, LocalDateTime.now().minusDays(2));
            createTicket("Problème DB", "Timeout de connexion", "ACCEPTE", "IMPORTANT", testUser, dev, projetGamma, LocalDateTime.now().minusDays(1));
            
            // dev est le reporter et testUser est l'assigné
            createTicket("Erreur 500", "L'API crash", "ACCEPTE", "URGENT", dev, testUser, projetAlpha, LocalDateTime.now().minusDays(3));
            createTicket("Typo page d'accueil", "Corriger la typo", "ACCEPTE", "NORMAL", dev, testUser, projetGamma, LocalDateTime.now().minusDays(4));

            log.info("DataSeeder : données de test créées avec succès !");
        }
    }

    private void createTicket(String title, String desc, String status, String level,
                               User reporter, User dev, Project project, LocalDateTime createdAt) {
        Ticket t = Ticket.builder()
                .title(title)
                .description(desc)
                .status(status)
                .level(level)
                .reporter(reporter)
                .assignedTo(dev)
                .project(project)
                .createdAt(createdAt)
                .build();
        ticketRepository.save(t);
    }
}
