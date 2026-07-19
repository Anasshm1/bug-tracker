package com.bugtracker.bugtracker.repository;

import com.bugtracker.bugtracker.entity.Ticket;
import com.bugtracker.bugtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    List<Ticket> findByReporter(User reporter);
    
    List<Ticket> findByAssignedTo(User assignedTo);

    @org.springframework.data.jpa.repository.Query("SELECT t.reporter, COUNT(t) FROM Ticket t WHERE t.status = 'ACCEPTE' AND t.reporter.role = 'REPORTER' AND t.createdAt >= :startDate AND t.createdAt <= :endDate GROUP BY t.reporter ORDER BY COUNT(t) DESC")
    List<Object[]> findTopReportersByAcceptedTickets(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @org.springframework.data.jpa.repository.Query("SELECT t.assignedTo, COUNT(t) FROM Ticket t WHERE t.status = 'ACCEPTE' AND t.assignedTo.role = 'DEV' AND t.createdAt >= :startDate AND t.createdAt <= :endDate GROUP BY t.assignedTo ORDER BY COUNT(t) DESC")
    List<Object[]> findTopDevsByAcceptedTickets(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

}
