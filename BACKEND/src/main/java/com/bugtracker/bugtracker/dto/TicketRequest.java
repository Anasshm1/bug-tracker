package com.bugtracker.bugtracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;
    
    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotBlank(message = "Le niveau est obligatoire")
    private String level;

    @NotNull(message = "Le projet est obligatoire")
    private Long projectId;

    private Long assignedToId;
}
