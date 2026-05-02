package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.RegisterRequest;
import com.niranjan.certificates.dto.request.UpdateOrgRequest;
import com.niranjan.certificates.dto.response.OrganizationResponse;
import com.niranjan.certificates.security.OrganizationPrincipal;
import com.niranjan.certificates.service.FileStorageService;
import com.niranjan.certificates.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/org")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final FileStorageService fileStorageService;

    @PostMapping("/register")
    public ResponseEntity<OrganizationResponse> register(@Valid @RequestBody RegisterRequest request) {
        OrganizationResponse response = organizationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<OrganizationResponse> getProfile(@AuthenticationPrincipal OrganizationPrincipal principal) {
        return ResponseEntity.ok(organizationService.getProfile(principal.getOrgId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<OrganizationResponse> updateProfile(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                              @Valid @RequestBody UpdateOrgRequest request) {
        return ResponseEntity.ok(organizationService.updateProfile(principal.getOrgId(), request));
    }

    @PostMapping("/logo")
    public ResponseEntity<OrganizationResponse> uploadLogo(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                           @RequestParam("file") MultipartFile file) {
        String logoUrl = fileStorageService.saveFile(file, "logos");
        return ResponseEntity.ok(organizationService.updateLogo(principal.getOrgId(), logoUrl));
    }

    @GetMapping("/logo")
    public ResponseEntity<byte[]> getLogo(@AuthenticationPrincipal OrganizationPrincipal principal) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(organizationService.getLogoContentType(principal.getOrgId())))
                .body(organizationService.getLogoImage(principal.getOrgId()));
    }
}
