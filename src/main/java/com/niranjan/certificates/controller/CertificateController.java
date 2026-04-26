package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.CertificateRequest;
import com.niranjan.certificates.dto.response.CertificateResponse;
import com.niranjan.certificates.dto.response.VerifyResponse;
import com.niranjan.certificates.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    // Hardcoded orgId until Phase 5 (JWT auth)
    private static final UUID ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @PostMapping("/api/certificates/generate")
    public ResponseEntity<CertificateResponse> generate(@Valid @RequestBody CertificateRequest request) {
        CertificateResponse response = certificateService.generate(ORG_ID, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/certificates")
    public ResponseEntity<List<CertificateResponse>> getAll() {
        return ResponseEntity.ok(certificateService.getAll(ORG_ID));
    }

    @GetMapping("/api/certificates/{id}")
    public ResponseEntity<CertificateResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(certificateService.getById(ORG_ID, id));
    }

    @GetMapping("/api/certificates/download/{id}")
    public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        byte[] pdfBytes = certificateService.downloadPdf(ORG_ID, id);
        String uniqueCode = certificateService.getUniqueCodeById(ORG_ID, id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", uniqueCode + ".pdf");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    // PUBLIC endpoint — no auth required
    @GetMapping("/api/verify/{uniqueCode}")
    public ResponseEntity<VerifyResponse> verify(@PathVariable String uniqueCode) {
        return ResponseEntity.ok(certificateService.verify(uniqueCode));
    }
}
