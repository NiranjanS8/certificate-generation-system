package com.niranjan.certificates.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateRequest {

    @NotNull(message = "Recipient ID is required")
    private UUID recipientId;

    @NotNull(message = "Signatory ID is required")
    private UUID signatoryId;

    @NotBlank(message = "Certificate title is required")
    private String certificateTitle;
}
