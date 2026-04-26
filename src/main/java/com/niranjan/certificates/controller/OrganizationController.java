package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.RegisterRequest;
import com.niranjan.certificates.dto.request.UpdateOrgRequest;
import com.niranjan.certificates.dto.response.OrganizationResponse;
import com.niranjan.certificates.service.FileStorageService;
import com.niranjan.certificates.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/register")
    public ResponseEntity<OrganizationResponse> register(@Valid @RequestBody RegisterRequest request) {
        OrganizationResponse response = organizationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<OrganizationResponse> getProfile(@RequestHeader("X-Org-Id") UUID orgId) {
        return ResponseEntity.ok(organizationService.getProfile(orgId));
    }

    @PutMapping("/profile")
    public ResponseEntity<OrganizationResponse> updateProfile(@RequestHeader("X-Org-Id") UUID orgId,
                                                              @Valid @RequestBody UpdateOrgRequest request) {
        return ResponseEntity.ok(organizationService.updateProfile(orgId, request));
    }

    @PostMapping("/logo")
    public ResponseEntity<OrganizationResponse> uploadLogo(@RequestHeader("X-Org-Id") UUID orgId,
                                                           @RequestParam("file") MultipartFile file) {
        String logoUrl = fileStorageService.saveFile(file, "logos");
        return ResponseEntity.ok(organizationService.updateLogo(orgId, logoUrl));
    }
}

