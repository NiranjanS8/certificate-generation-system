package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.dto.response.RecipientResponse;
import com.niranjan.certificates.service.RecipientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipients")
@RequiredArgsConstructor
public class RecipientController {

    private final RecipientService recipientService;

    @PostMapping
    public ResponseEntity<RecipientResponse> create(@RequestHeader("X-Org-Id") UUID orgId,
                                                    @Valid @RequestBody RecipientRequest request) {
        RecipientResponse response = recipientService.create(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RecipientResponse>> getAll(@RequestHeader("X-Org-Id") UUID orgId) {
        return ResponseEntity.ok(recipientService.getAll(orgId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipientResponse> getById(@RequestHeader("X-Org-Id") UUID orgId,
                                                     @PathVariable UUID id) {
        return ResponseEntity.ok(recipientService.getById(orgId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipientResponse> update(@RequestHeader("X-Org-Id") UUID orgId,
                                                    @PathVariable UUID id,
                                                    @Valid @RequestBody RecipientRequest request) {
        return ResponseEntity.ok(recipientService.update(orgId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader("X-Org-Id") UUID orgId,
                                       @PathVariable UUID id) {
        recipientService.delete(orgId, id);
        return ResponseEntity.noContent().build();
    }
}
