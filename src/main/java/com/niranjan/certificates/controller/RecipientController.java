package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.dto.response.RecipientResponse;
import com.niranjan.certificates.security.OrganizationPrincipal;
import com.niranjan.certificates.service.RecipientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipients")
@RequiredArgsConstructor
public class RecipientController {

    private final RecipientService recipientService;

    @PostMapping
    public ResponseEntity<RecipientResponse> create(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                    @Valid @RequestBody RecipientRequest request) {
        RecipientResponse response = recipientService.create(principal.getOrgId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RecipientResponse>> getAll(@AuthenticationPrincipal OrganizationPrincipal principal) {
        return ResponseEntity.ok(recipientService.getAll(principal.getOrgId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipientResponse> getById(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                     @PathVariable UUID id) {
        return ResponseEntity.ok(recipientService.getById(principal.getOrgId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipientResponse> update(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                    @PathVariable UUID id,
                                                    @Valid @RequestBody RecipientRequest request) {
        return ResponseEntity.ok(recipientService.update(principal.getOrgId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal OrganizationPrincipal principal,
                                       @PathVariable UUID id) {
        recipientService.delete(principal.getOrgId(), id);
        return ResponseEntity.noContent().build();
    }
}
