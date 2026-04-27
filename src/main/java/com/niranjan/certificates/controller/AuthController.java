package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.RefreshTokenRequest;
import com.niranjan.certificates.dto.request.LoginRequest;
import com.niranjan.certificates.dto.response.AuthResponse;
import com.niranjan.certificates.security.JwtService;
import com.niranjan.certificates.security.OrganizationPrincipal;
import com.niranjan.certificates.security.OrganizationUserDetailsService;
import io.jsonwebtoken.JwtException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final OrganizationUserDetailsService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        OrganizationPrincipal principal = (OrganizationPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(buildAuthResponse(principal));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            String username = jwtService.extractUsername(request.getRefreshToken());
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!jwtService.isRefreshTokenValid(request.getRefreshToken(), userDetails)) {
                throw new BadCredentialsException("Invalid refresh token");
            }

            OrganizationPrincipal principal = (OrganizationPrincipal) userDetails;
            return ResponseEntity.ok(buildAuthResponse(principal));
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException("Invalid refresh token", ex);
        }
    }

    private AuthResponse buildAuthResponse(OrganizationPrincipal principal) {
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInSeconds(jwtService.getExpirationSeconds())
                .refreshExpiresInSeconds(jwtService.getRefreshExpirationSeconds())
                .orgId(principal.getOrgId())
                .email(principal.getEmail())
                .build();
    }
}
