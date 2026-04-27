package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.SignatoryRequest;
import com.niranjan.certificates.dto.response.SignatoryResponse;
import com.niranjan.certificates.security.OrganizationPrincipal;
import com.niranjan.certificates.service.FileStorageService;
import com.niranjan.certificates.service.SignatoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/signatories")
@RequiredArgsConstructor
public class SignatoryController {

    private final SignatoryService signatoryService;
    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<SignatoryResponse> create(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                    @Valid @RequestBody SignatoryRequest request) {
        SignatoryResponse response = signatoryService.create(principal.getOrgId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SignatoryResponse>> getAll(@AuthenticationPrincipal OrganizationPrincipal principal) {
        return ResponseEntity.ok(signatoryService.getAll(principal.getOrgId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SignatoryResponse> getById(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                     @PathVariable UUID id) {
        return ResponseEntity.ok(signatoryService.getById(principal.getOrgId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SignatoryResponse> update(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                    @PathVariable UUID id,
                                                    @Valid @RequestBody SignatoryRequest request) {
        return ResponseEntity.ok(signatoryService.update(principal.getOrgId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal OrganizationPrincipal principal,
                                       @PathVariable UUID id) {
        signatoryService.delete(principal.getOrgId(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<SignatoryResponse> setDefault(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                        @PathVariable UUID id) {
        return ResponseEntity.ok(signatoryService.setDefault(principal.getOrgId(), id));
    }

    @PostMapping("/{id}/signature")
    public ResponseEntity<SignatoryResponse> uploadSignature(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                             @PathVariable UUID id,
                                                             @RequestParam("file") MultipartFile file) {
        String signatureUrl = fileStorageService.saveFile(file, "signatures");
        return ResponseEntity.ok(signatoryService.updateSignatureUrl(principal.getOrgId(), id, signatureUrl));
    }
}
