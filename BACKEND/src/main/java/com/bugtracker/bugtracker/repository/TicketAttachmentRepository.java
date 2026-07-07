package com.bugtracker.bugtracker.repository;

import com.bugtracker.bugtracker.entity.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {
}
