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

    // Hardcoded orgId until Phase 5 (JWT auth)
    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @PostMapping
    public ResponseEntity<SignatoryResponse> create(@Valid @RequestBody SignatoryRequest request) {
        SignatoryResponse response = signatoryService.create(ORG_ID, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SignatoryResponse>> getAll() {
        return ResponseEntity.ok(signatoryService.getAll(ORG_ID));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SignatoryResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(signatoryService.getById(ORG_ID, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SignatoryResponse> update(@PathVariable UUID id,
                                                    @Valid @RequestBody SignatoryRequest request) {
        return ResponseEntity.ok(signatoryService.update(ORG_ID, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        signatoryService.delete(ORG_ID, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<SignatoryResponse> setDefault(@PathVariable UUID id) {
        return ResponseEntity.ok(signatoryService.setDefault(ORG_ID, id));
    }

    @PostMapping("/{id}/signature")
    public ResponseEntity<SignatoryResponse> uploadSignature(@PathVariable UUID id,
                                                             @RequestParam("file") MultipartFile file) {
        String signatureUrl = fileStorageService.saveFile(file, "signatures");
        return ResponseEntity.ok(signatoryService.updateSignatureUrl(ORG_ID, id, signatureUrl));
    }
}
