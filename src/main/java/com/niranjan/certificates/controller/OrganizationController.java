package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.UpdateOrgRequest;
import com.niranjan.certificates.dto.response.OrganizationResponse;
import com.niranjan.certificates.service.FileStorageService;
import com.niranjan.certificates.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/org")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final FileStorageService fileStorageService;

    // Hardcoded orgId until Phase 5 (JWT auth)
    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @GetMapping("/profile")
    public ResponseEntity<OrganizationResponse> getProfile() {
        return ResponseEntity.ok(organizationService.getProfile(ORG_ID));
    }

    @PutMapping("/profile")
    public ResponseEntity<OrganizationResponse> updateProfile(@Valid @RequestBody UpdateOrgRequest request) {
        return ResponseEntity.ok(organizationService.updateProfile(ORG_ID, request));
    }

    @PostMapping("/logo")
    public ResponseEntity<OrganizationResponse> uploadLogo(@RequestParam("file") MultipartFile file) {
        String logoUrl = fileStorageService.saveFile(file, "logos");
        return ResponseEntity.ok(organizationService.updateLogo(ORG_ID, logoUrl));
    }
}
