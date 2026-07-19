package com.bugtracker.bugtracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;
import org.hibernate.annotations.Synchronize;

import java.time.LocalDateTime;

/**
 * Vue en lecture seule mappee sur la vue PostgreSQL "ticket_monitoring".
 *
 * @Subselect force Hibernate a utiliser cette requete SQL inline au lieu de
 * creer ou modifier une table. Cela empeche ddl-auto=update de generer une
 * vraie table "ticket_monitoring" qui remplacerait la vue.
 *
 * @Synchronize declare les tables sous-jacentes afin qu'Hibernate
 * fasse un flush avant les requetes sur cette entite.
 */
@Entity
@Immutable
@Subselect("""
    WITH latest_status AS (
        SELECT DISTINCT ON (ticket_id)
            ticket_id,
            new_status  AS status,
            changed_at  AS status_date
        FROM status_history
        ORDER BY ticket_id, changed_at DESC
    )
    SELECT
        t.id                                                         AS ticket_id,
        COALESCE(ls.status, t.status)                                AS status,
        COALESCE(ls.status_date, t.created_at)                       AS status_date,
        EXTRACT(DAY FROM (NOW() - COALESCE(ls.status_date, t.created_at)))::INT
                                                                     AS days_in_status,
        CASE
            WHEN sla.max_days IS NULL THEN 'OK'
            WHEN EXTRACT(DAY FROM (NOW() - COALESCE(ls.status_date, t.created_at))) > sla.max_days
                 THEN 'Retard'
            ELSE 'OK'
        END                                                          AS alert
    FROM tickets t
    LEFT JOIN latest_status ls  ON ls.ticket_id = t.id
    LEFT JOIN status_sla    sla ON sla.status    = COALESCE(ls.status, t.status)
    """)
@Synchronize({"tickets", "status_history", "status_sla"})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketMonitoring {

    @Id
    @Column(name = "ticket_id")
    private Long ticketId;

    @Column(name = "status")
    private String status;

    @Column(name = "status_date")
    private LocalDateTime statusDate;

    @Column(name = "days_in_status")
    private Integer daysInStatus;

    /** "OK" ou "Retard" */
    @Column(name = "alert")
    private String alert;
}