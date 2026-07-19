package com.bugtracker.bugtracker.repository;

import com.bugtracker.bugtracker.entity.CommentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentAttachmentRepository extends JpaRepository<CommentAttachment, Long> {
}
