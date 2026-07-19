package com.bugtracker.bugtracker.repository;

import com.bugtracker.bugtracker.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {
    
    List<StatusHistory> findByTicketIdOrderByChangedAtDesc(Long ticketId);
    
    Optional<StatusHistory> findTopByTicketIdOrderByChangedAtDesc(Long ticketId);
}
