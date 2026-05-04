package com.niranjan.certificates.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateResponse {

    private UUID id;
    private UUID orgId;
    private UUID recipientId;
    private UUID signatoryId;
    private String recipientName;
    private String courseName;
    private Integer score;
    private String grade;
    private LocalDate completionDate;
    private String certificateTitle;
    private String uniqueCode;
    private String fileUrl;
    private String pdfUrl;
    private String imageUrl;
    private String status;
    private LocalDateTime issuedAt;
}
