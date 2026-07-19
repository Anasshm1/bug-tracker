package com.bugtracker.bugtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketMonitoringDto {
    private Long ticketId;
    private String status;
    private LocalDateTime statusDate;
    private Integer daysInStatus;
    private String alert;
}