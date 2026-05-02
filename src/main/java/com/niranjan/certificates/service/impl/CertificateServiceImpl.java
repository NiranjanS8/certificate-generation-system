package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.CertificateRequest;
import com.niranjan.certificates.dto.response.CertificateResponse;
import com.niranjan.certificates.dto.response.VerifyResponse;
import com.niranjan.certificates.entity.*;
import com.niranjan.certificates.exception.DuplicateResourceException;
import com.niranjan.certificates.exception.IneligibleRecipientException;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.CertificateRepository;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.RecipientRepository;
import com.niranjan.certificates.repository.SignatoryRepository;
import com.niranjan.certificates.service.CertificateService;
import com.niranjan.certificates.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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

    private static final String DUPLICATE_RECIPIENT_CERTIFICATE_MESSAGE =
            "A certificate has already been generated for this recipient.";
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public CertificateResponse generate(UUID orgId, CertificateRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        Recipient recipient = recipientRepository.findByIdAndOrganizationId(request.getRecipientId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", request.getRecipientId()));

        if (certificateRepository.existsByOrganizationIdAndRecipientId(orgId, recipient.getId())) {
            throw new DuplicateResourceException(DUPLICATE_RECIPIENT_CERTIFICATE_MESSAGE);
        }

        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(request.getSignatoryId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", request.getSignatoryId()));

        // Score eligibility check against course minimum score
        Course course = recipient.getCourse();
        if (Boolean.FALSE.equals(course.getIsActive())) {
            throw new IllegalArgumentException("Cannot generate certificate for inactive course: " + course.getName());
        }

        if (course.getMinScore() != null && course.getMinScore() > 0) {
            int recipientScore = recipient.getScore() != null ? recipient.getScore() : 0;
            if (recipientScore < course.getMinScore()) {
                throw new IneligibleRecipientException(
                        recipient.getFullName(), recipientScore, course.getMinScore(), course.getName());
            }
        }

        if (certificateRepository.existsByOrganizationIdAndRecipientId(orgId, recipient.getId())) {
            throw duplicateCertificateException(recipient, course);
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

        try {
            Certificate saved = certificateRepository.save(certificate);
            return mapToResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            deleteGeneratedPdf(filePath);
            throw duplicateCertificateException(recipient, course);
        } catch (RuntimeException ex) {
            deleteGeneratedPdf(filePath);
            throw ex;
        }
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
    @Transactional
    public CertificateResponse update(UUID orgId, UUID id, CertificateRequest request) {
        Certificate certificate = certificateRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));

        Recipient recipient = recipientRepository.findByIdAndOrganizationId(request.getRecipientId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", request.getRecipientId()));

        if (certificateRepository.existsByOrganizationIdAndRecipientIdAndIdNot(orgId, recipient.getId(), id)) {
            throw new DuplicateResourceException(DUPLICATE_RECIPIENT_CERTIFICATE_MESSAGE);
        }

        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(request.getSignatoryId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", request.getSignatoryId()));

        Course course = recipient.getCourse();
        if (course.getMinScore() != null && course.getMinScore() > 0) {
            int recipientScore = recipient.getScore() != null ? recipient.getScore() : 0;
            if (recipientScore < course.getMinScore()) {
                throw new IneligibleRecipientException(
                        recipient.getFullName(), recipientScore, course.getMinScore(), course.getName());
            }
        }

        String filePath = pdfService.generateCertificate(certificate.getOrganization(), recipient, signatory,
                request.getCertificateTitle(), certificate.getUniqueCode());

        certificate.setRecipient(recipient);
        certificate.setSignatory(signatory);
        certificate.setCertificateTitle(request.getCertificateTitle());
        certificate.setFileUrl(filePath);

        Certificate saved = certificateRepository.save(certificate);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CertificateResponse revoke(UUID orgId, UUID id) {
        Certificate certificate = certificateRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate", "id", id));

        certificate.setStatus(CertificateStatus.REVOKED);
        Certificate saved = certificateRepository.save(certificate);
        return mapToResponse(saved);
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

    private DuplicateResourceException duplicateCertificateException(Recipient recipient, Course course) {
        return new DuplicateResourceException(String.format(
                "Certificate already exists for recipient '%s' and course '%s'",
                recipient.getFullName(), course.getName()));
    }

    private void deleteGeneratedPdf(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(filePath));
        } catch (IOException ignored) {
            // Best effort cleanup after a failed transaction.
        }
    }

    private CertificateResponse mapToResponse(Certificate certificate) {
        return CertificateResponse.builder()
                .id(certificate.getId())
                .orgId(certificate.getOrganization().getId())
                .recipientId(certificate.getRecipient().getId())
                .signatoryId(certificate.getSignatory().getId())
                .recipientName(certificate.getRecipient().getFullName())
                .courseName(certificate.getRecipient().getCourse().getName())
                .score(certificate.getRecipient().getScore())
                .grade(certificate.getRecipient().getGrade())
                .completionDate(certificate.getRecipient().getCompletionDate())
                .certificateTitle(certificate.getCertificateTitle())
                .uniqueCode(certificate.getUniqueCode())
                .fileUrl(certificate.getFileUrl())
                .status(certificate.getStatus().name())
                .issuedAt(certificate.getIssuedAt())
                .build();
    }
}
