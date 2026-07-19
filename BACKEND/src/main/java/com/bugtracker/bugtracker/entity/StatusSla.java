package com.bugtracker.bugtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "status_sla")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusSla {

    @Id
    @Column(length = 30)
    private String status;

    @Column(name = "max_days", nullable = false)
    private Integer maxDays;
}
