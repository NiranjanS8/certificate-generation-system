package com.niranjan.certificates.service;

import com.niranjan.certificates.dto.request.CertificateRequest;
import com.niranjan.certificates.dto.response.CertificateResponse;
import com.niranjan.certificates.dto.response.VerifyResponse;

import java.util.List;
import java.util.UUID;

public interface CertificateService {

    CertificateResponse generate(UUID orgId, CertificateRequest request);

    List<CertificateResponse> getAll(UUID orgId);

    CertificateResponse getById(UUID orgId, UUID id);

    CertificateResponse update(UUID orgId, UUID id, CertificateRequest request);

    CertificateResponse revoke(UUID orgId, UUID id);

    byte[] downloadPdf(UUID orgId, UUID id);

    String getUniqueCodeById(UUID orgId, UUID id);

    VerifyResponse verify(String uniqueCode);
}
