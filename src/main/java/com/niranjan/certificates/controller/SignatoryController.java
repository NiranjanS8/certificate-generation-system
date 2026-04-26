package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.SignatoryRequest;
import com.niranjan.certificates.dto.response.SignatoryResponse;
import com.niranjan.certificates.service.FileStorageService;
import com.niranjan.certificates.service.SignatoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<SignatoryResponse> create(@RequestHeader("X-Org-Id") UUID orgId,
                                                    @Valid @RequestBody SignatoryRequest request) {
        SignatoryResponse response = signatoryService.create(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SignatoryResponse>> getAll(@RequestHeader("X-Org-Id") UUID orgId) {
        return ResponseEntity.ok(signatoryService.getAll(orgId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SignatoryResponse> getById(@RequestHeader("X-Org-Id") UUID orgId,
                                                     @PathVariable UUID id) {
        return ResponseEntity.ok(signatoryService.getById(orgId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SignatoryResponse> update(@RequestHeader("X-Org-Id") UUID orgId,
                                                    @PathVariable UUID id,
                                                    @Valid @RequestBody SignatoryRequest request) {
        return ResponseEntity.ok(signatoryService.update(orgId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") UUID orgId,
                                       @PathVariable UUID id) {
        signatoryService.delete(orgId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<SignatoryResponse> setDefault(@RequestHeader("X-Org-Id") UUID orgId,
                                                        @PathVariable UUID id) {
        return ResponseEntity.ok(signatoryService.setDefault(orgId, id));
    }

    @PostMapping("/{id}/signature")
    public ResponseEntity<SignatoryResponse> uploadSignature(@RequestHeader("X-Org-Id") UUID orgId,
                                                             @PathVariable UUID id,
                                                             @RequestParam("file") MultipartFile file) {
        String signatureUrl = fileStorageService.saveFile(file, "signatures");
        return ResponseEntity.ok(signatoryService.updateSignatureUrl(orgId, id, signatureUrl));
    }
}
