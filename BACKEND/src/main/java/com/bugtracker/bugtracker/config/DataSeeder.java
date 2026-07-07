package com.bugtracker.bugtracker.config;

import com.bugtracker.bugtracker.entity.Project;
import com.bugtracker.bugtracker.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProjectRepository projectRepository;

    @Override
    public void run(String... args) throws Exception {
        if (projectRepository.count() == 0) {
            projectRepository.save(new Project(null, "Projet Alpha", "ENCOURS"));
            projectRepository.save(new Project(null, "Projet Beta", "ENCOURS"));
            projectRepository.save(new Project(null, "Projet Gamma", "ENCOURS"));
        }

        // Force l'update de Projet Beta en COMPLETE
        projectRepository.findAll().forEach(p -> {
            if ("Projet Beta".equals(p.getName()) && !"COMPLETE".equals(p.getStatus())) {
                p.setStatus("COMPLETE");
                projectRepository.save(p);
            }
        });
    }
}
