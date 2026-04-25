package com.niranjan.certificates.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignatoryResponse {

    private UUID id;
    private UUID orgId;
    private String name;
    private String title;
    private String signatureUrl;
    private Boolean isDefault;
}
