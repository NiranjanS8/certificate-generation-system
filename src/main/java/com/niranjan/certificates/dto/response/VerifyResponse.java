package com.niranjan.certificates.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyResponse {

    private String recipientName;
    private String courseName;
    private String organizationName;
    private String certificateTitle;
    private String status;
    private LocalDateTime issuedAt;
}
