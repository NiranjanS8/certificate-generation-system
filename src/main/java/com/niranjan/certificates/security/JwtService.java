package com.niranjan.certificates.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private static final String TOKEN_TYPE_CLAIM = "tokenType";
    private static final String SESSION_ID_CLAIM = "sessionId";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    private final SecretKey signingKey;
    private final long accessExpirationSeconds;
    private final long refreshExpirationSeconds;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration-seconds}") long accessExpirationSeconds,
            @Value("${app.security.jwt.refresh-expiration-seconds}") long refreshExpirationSeconds) {
        this.signingKey = Keys.hmacShaKeyFor(sha256(secret));
        this.accessExpirationSeconds = accessExpirationSeconds;
        this.refreshExpirationSeconds = refreshExpirationSeconds;
    }

    public String generateAccessToken(OrganizationPrincipal principal) {
        return generateToken(principal, ACCESS_TOKEN_TYPE, accessExpirationSeconds);
    }

    public String generateRefreshToken(OrganizationPrincipal principal) {
        return generateToken(principal, REFRESH_TOKEN_TYPE, refreshExpirationSeconds);
    }

    public String generateToken(OrganizationPrincipal principal) {
        return generateAccessToken(principal);
    }

    private String generateToken(OrganizationPrincipal principal, String tokenType, long expiresInSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .claims(Map.of(
                        "orgId", principal.getOrgId().toString(),
                        "role", "ORG_ADMIN",
                        SESSION_ID_CLAIM, principal.getCurrentAuthSessionId(),
                        TOKEN_TYPE_CLAIM, tokenType))
                .subject(principal.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expiresInSeconds)))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        return isAccessTokenValid(token, userDetails);
    }

    public boolean isAccessTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, ACCESS_TOKEN_TYPE);
    }

    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, REFRESH_TOKEN_TYPE);
    }

    private boolean isTokenValid(String token, UserDetails userDetails, String expectedTokenType) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername())
                && expectedTokenType.equals(extractTokenType(token))
                && isCurrentSession(token, userDetails)
                && !isTokenExpired(token);
    }

    public long getExpirationSeconds() {
        return accessExpirationSeconds;
    }

    public long getRefreshExpirationSeconds() {
        return refreshExpirationSeconds;
    }

    private String extractTokenType(String token) {
        return extractAllClaims(token).get(TOKEN_TYPE_CLAIM, String.class);
    }

    private String extractSessionId(String token) {
        return extractAllClaims(token).get(SESSION_ID_CLAIM, String.class);
    }

    private boolean isCurrentSession(String token, UserDetails userDetails) {
        if (!(userDetails instanceof OrganizationPrincipal principal)) {
            return false;
        }

        String tokenSessionId = extractSessionId(token);
        return tokenSessionId != null && tokenSessionId.equals(principal.getCurrentAuthSessionId());
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private byte[] sha256(String secret) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
