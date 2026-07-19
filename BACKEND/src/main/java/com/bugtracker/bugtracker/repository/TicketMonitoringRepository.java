package com.bugtracker.bugtracker.repository;

import com.bugtracker.bugtracker.entity.TicketMonitoring;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketMonitoringRepository extends JpaRepository<TicketMonitoring, Long> {

    List<TicketMonitoring> findByAlert(String alert);

    Optional<TicketMonitoring> findByTicketId(Long ticketId);

    /** Retourne le monitoring pour une liste de ticketIds (pour filtrer par reporter) */
    List<TicketMonitoring> findByTicketIdIn(List<Long> ticketIds);
}