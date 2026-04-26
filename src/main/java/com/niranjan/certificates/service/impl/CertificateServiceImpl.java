package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.CertificateRequest;
import com.niranjan.certificates.dto.response.CertificateResponse;
import com.niranjan.certificates.dto.response.VerifyResponse;
import com.niranjan.certificates.entity.*;
import com.niranjan.certificates.exception.IneligibleRecipientException;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.CertificateRepository;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.RecipientRepository;
import com.niranjan.certificates.repository.SignatoryRepository;
import com.niranjan.certificates.service.CertificateService;
import com.niranjan.certificates.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateServiceImpl implements CertificateService {

    private final CertificateRepository certificateRepository;
    private final OrganizationRepository organizationRepository;
    private final RecipientRepository recipientRepository;
    private final SignatoryRepository signatoryRepository;
    private final PdfService pdfService;

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public CertificateResponse generate(UUID orgId, CertificateRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        Recipient recipient = recipientRepository.findByIdAndOrganizationId(request.getRecipientId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", request.getRecipientId()));

        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(request.getSignatoryId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", request.getSignatoryId()));

        // Score eligibility check against course minimum score
        Course course = recipient.getCourse();
        if (course.getMinScore() != null && course.getMinScore() > 0) {
            int recipientScore = recipient.getScore() != null ? recipient.getScore() : 0;
            if (recipientScore < course.getMinScore()) {
                throw new IneligibleRecipientException(
                        recipient.getFullName(), recipientScore, course.getMinScore(), course.getName());
            }
        }

        // Generate unique code: CERT-XXXXXX
        String uniqueCode = generateUniqueCode();

        // Generate PDF
        String filePath = pdfService.generateCertificate(org, recipient, signatory,
                request.getCertificateTitle(), uniqueCode);

        // Save certificate entity
        Certificate certificate = Certificate.builder()
                .organization(org)
                .recipient(recipient)
                .signatory(signatory)
                .certificateTitle(request.getCertificateTitle())
                .uniqueCode(uniqueCode)
                .fileUrl(filePath)
                .status(CertificateStatus.ISSUED)
                .build();

        Certificate saved = certificateRepository.save(certificate);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CertificateResponse> getAll(UUID orgId) {
        return certificateRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CertificateResponse getById(UUID orgId, UUID id) {
        Certificate certificate = certificateRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));
        return mapToResponse(certificate);
    }

    @Override
    public byte[] downloadPdf(UUID orgId, UUID id) {
        Certificate certificate = certificateRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));

        Path path = Paths.get(certificate.getFileUrl());
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read certificate PDF file", e);
        }
    }

    @Override
    public String getUniqueCodeById(UUID orgId, UUID id) {
        Certificate certificate = certificateRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));
        return certificate.getUniqueCode();
    }

    @Override
    @Transactional(readOnly = true)
    public VerifyResponse verify(String uniqueCode) {
        Certificate certificate = certificateRepository.findByUniqueCode(uniqueCode)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "uniqueCode", uniqueCode));

        // Return 404 for REVOKED certificates
        if (certificate.getStatus() == CertificateStatus.REVOKED) {
            throw new ResourceNotFoundException("Certificate", "uniqueCode", uniqueCode);
        }

        return VerifyResponse.builder()
                .recipientName(certificate.getRecipient().getFullName())
                .courseName(certificate.getRecipient().getCourse().getName())
                .organizationName(certificate.getOrganization().getName())
                .certificateTitle(certificate.getCertificateTitle())
                .status(certificate.getStatus().name())
                .issuedAt(certificate.getIssuedAt())
                .build();
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("CERT-");
            for (int i = 0; i < 6; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            code = sb.toString();
        } while (certificateRepository.existsByUniqueCode(code));
        return code;
    }

    private CertificateResponse mapToResponse(Certificate certificate) {
        return CertificateResponse.builder()
                .id(certificate.getId())
                .orgId(certificate.getOrganization().getId())
                .recipientId(certificate.getRecipient().getId())
                .signatoryId(certificate.getSignatory().getId())
                .recipientName(certificate.getRecipient().getFullName())
                .courseName(certificate.getRecipient().getCourse().getName())
                .certificateTitle(certificate.getCertificateTitle())
                .uniqueCode(certificate.getUniqueCode())
                .fileUrl(certificate.getFileUrl())
                .status(certificate.getStatus().name())
                .issuedAt(certificate.getIssuedAt())
                .build();
    }
}
