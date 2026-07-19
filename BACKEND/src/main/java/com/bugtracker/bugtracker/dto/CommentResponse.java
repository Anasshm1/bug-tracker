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
public class CommentResponse {
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private String authorName;
    private String authorRole;
    private List<AttachmentInfo> attachments;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AttachmentInfo {
        private Long id;
        private String fileName;
        private String filePath;
        private String fileType;
    }
}
