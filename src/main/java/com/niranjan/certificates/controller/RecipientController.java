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

    // Hardcoded orgId until Phase 5 (JWT auth)
    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @PostMapping
    public ResponseEntity<RecipientResponse> create(@Valid @RequestBody RecipientRequest request) {
        RecipientResponse response = recipientService.create(ORG_ID, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RecipientResponse>> getAll() {
        return ResponseEntity.ok(recipientService.getAll(ORG_ID));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipientResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(recipientService.getById(ORG_ID, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipientResponse> update(@PathVariable UUID id,
                                                    @Valid @RequestBody RecipientRequest request) {
        return ResponseEntity.ok(recipientService.update(ORG_ID, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        recipientService.delete(ORG_ID, id);
        return ResponseEntity.noContent().build();
    }
}
