package com.bugtracker.bugtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    
    private String reporterName;
    private String reporterEmail;
    
    private String level;
    private Long projectId;
    private String projectName;
    private Long assignedToId;
    private String assignedToName;
    
    private List<String> attachments;
}

