package com.bugtracker.bugtracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;
    
    @NotBlank(message = "La description est obligatoire")
    private String description;
}
