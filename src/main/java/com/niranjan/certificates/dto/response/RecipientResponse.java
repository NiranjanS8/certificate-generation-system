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
public class RecipientResponse {

    private UUID id;
    private UUID orgId;
    private String fullName;
    private String email;
    private String courseName;
    private Integer score;
    private String grade;
    private LocalDate completionDate;
    private LocalDateTime createdAt;
}
