package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.CertificateRequest;
import com.niranjan.certificates.dto.response.CertificateResponse;
import com.niranjan.certificates.dto.response.VerifyResponse;
import com.niranjan.certificates.security.OrganizationPrincipal;
import com.niranjan.certificates.service.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/api/certificates/generate")
    public ResponseEntity<CertificateResponse> generate(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                        @Valid @RequestBody CertificateRequest request) {
        CertificateResponse response = certificateService.generate(principal.getOrgId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/certificates")
    public ResponseEntity<List<CertificateResponse>> getAll(@AuthenticationPrincipal OrganizationPrincipal principal) {
        return ResponseEntity.ok(certificateService.getAll(principal.getOrgId()));
    }

    @GetMapping("/api/certificates/{id}")
    public ResponseEntity<CertificateResponse> getById(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                       @PathVariable UUID id) {
        return ResponseEntity.ok(certificateService.getById(principal.getOrgId(), id));
    }

    @GetMapping("/api/certificates/download/{id}")
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal OrganizationPrincipal principal,
                                           @PathVariable UUID id) {
        byte[] pdfBytes = certificateService.downloadPdf(principal.getOrgId(), id);
        String uniqueCode = certificateService.getUniqueCodeById(principal.getOrgId(), id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", uniqueCode + ".pdf");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    // PUBLIC endpoint — no auth required, no X-Org-Id needed
    @GetMapping("/api/verify/{uniqueCode}")
    public ResponseEntity<VerifyResponse> verify(@PathVariable String uniqueCode) {
        return ResponseEntity.ok(certificateService.verify(uniqueCode));
    }
}
