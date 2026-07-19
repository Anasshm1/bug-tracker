package com.bugtracker.bugtracker.service;

import com.bugtracker.bugtracker.dto.CommentResponse;
import com.bugtracker.bugtracker.entity.Comment;
import com.bugtracker.bugtracker.entity.CommentAttachment;
import com.bugtracker.bugtracker.entity.Ticket;
import com.bugtracker.bugtracker.entity.User;
import com.bugtracker.bugtracker.repository.CommentAttachmentRepository;
import com.bugtracker.bugtracker.repository.CommentRepository;
import com.bugtracker.bugtracker.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentAttachmentRepository commentAttachmentRepository;
    private final TicketRepository ticketRepository;
    private final FileStorageService fileStorageService;

    /**
     * Ajouter un commentaire à un ticket.
     */
    public CommentResponse addComment(Long ticketId, String content, List<MultipartFile> files, User author) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable avec l'ID : " + ticketId));

        Comment comment = Comment.builder()
                .content(content)
                .ticket(ticket)
                .author(author)
                .build();

        commentRepository.save(comment);

        // Sauvegarder les pièces jointes
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String storedName = fileStorageService.storeFile(file);
                CommentAttachment attachment = CommentAttachment.builder()
                        .fileName(file.getOriginalFilename())
                        .filePath("/uploads/" + storedName)
                        .fileType(file.getContentType())
                        .comment(comment)
                        .build();
                commentAttachmentRepository.save(attachment);
                comment.getAttachments().add(attachment);
            }
        }

        log.info("Commentaire ajouté au ticket #{} par {}", ticketId, author.getEmail());
        return mapToResponse(comment);
    }

    /**
     * Récupérer tous les commentaires d'un ticket.
     */
    public List<CommentResponse> getCommentsByTicket(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(Comment comment) {
        List<CommentResponse.AttachmentInfo> attachmentInfos = comment.getAttachments() != null
                ? comment.getAttachments().stream()
                    .map(a -> CommentResponse.AttachmentInfo.builder()
                            .id(a.getId())
                            .fileName(a.getFileName())
                            .filePath(a.getFilePath())
                            .fileType(a.getFileType())
                            .build())
                    .collect(Collectors.toList())
                : List.of();

        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .authorName(comment.getAuthor().getFullName())
                .authorRole(comment.getAuthor().getRole().name())
                .attachments(attachmentInfos)
                .build();
    }
}
