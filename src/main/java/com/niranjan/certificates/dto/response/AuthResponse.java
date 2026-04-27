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
public class AuthResponse {

    private String token;
    private String refreshToken;
    private String tokenType;
    private long expiresInSeconds;
    private long refreshExpiresInSeconds;
    private UUID orgId;
    private String email;
}
