package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.CertificateRequest;
import com.niranjan.certificates.entity.Course;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.entity.Signatory;
import com.niranjan.certificates.exception.DuplicateResourceException;
import com.niranjan.certificates.repository.CertificateRepository;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.RecipientRepository;
import com.niranjan.certificates.repository.SignatoryRepository;
import com.niranjan.certificates.service.PdfService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceImplTest {

    private final CertificateRepository certificateRepository = mock(CertificateRepository.class);
    private final OrganizationRepository organizationRepository = mock(OrganizationRepository.class);
    private final RecipientRepository recipientRepository = mock(RecipientRepository.class);
    private final SignatoryRepository signatoryRepository = mock(SignatoryRepository.class);
    private final PdfService pdfService = mock(PdfService.class);

    private final CertificateServiceImpl service = new CertificateServiceImpl(
            certificateRepository,
            organizationRepository,
            recipientRepository,
            signatoryRepository,
            pdfService);

    @Test
    void generateRejectsDuplicateCertificateForSameRecipientCourse() {
        UUID orgId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID signatoryId = UUID.randomUUID();

        Organization organization = Organization.builder()
                .id(orgId)
                .name("Acme")
                .build();

        Course course = Course.builder()
                .id(courseId)
                .organization(organization)
                .name("Web Development")
                .minScore(70)
                .build();

        Recipient recipient = Recipient.builder()
                .id(recipientId)
                .organization(organization)
                .course(course)
                .fullName("John Doe")
                .score(95)
                .completionDate(LocalDate.now())
                .build();

        Signatory signatory = Signatory.builder()
                .id(signatoryId)
                .organization(organization)
                .name("Dr. Sarah Johnson")
                .build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(recipientRepository.findByIdAndOrganizationId(recipientId, orgId)).thenReturn(Optional.of(recipient));
        when(signatoryRepository.findByIdAndOrganizationId(signatoryId, orgId)).thenReturn(Optional.of(signatory));
        when(certificateRepository.existsByOrganizationIdAndRecipientId(orgId, recipientId)).thenReturn(true);

        CertificateRequest request = new CertificateRequest(recipientId, signatoryId, "Certificate of Completion");

        assertThrows(DuplicateResourceException.class, () -> service.generate(orgId, request));

        verify(pdfService, never()).generateCertificate(
                any(),
                any(),
                any(),
                anyString(),
                anyString());
    }

    @Test
    void generateRejectsInactiveCourse() {
        UUID orgId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID signatoryId = UUID.randomUUID();

        Organization organization = Organization.builder()
                .id(orgId)
                .name("Acme")
                .build();

        Course course = Course.builder()
                .id(courseId)
                .organization(organization)
                .name("Archived Course")
                .isActive(false)
                .build();

        Recipient recipient = Recipient.builder()
                .id(recipientId)
                .organization(organization)
                .course(course)
                .fullName("John Doe")
                .score(95)
                .completionDate(LocalDate.now())
                .build();

        Signatory signatory = Signatory.builder()
                .id(signatoryId)
                .organization(organization)
                .name("Dr. Sarah Johnson")
                .build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(recipientRepository.findByIdAndOrganizationId(recipientId, orgId)).thenReturn(Optional.of(recipient));
        when(signatoryRepository.findByIdAndOrganizationId(signatoryId, orgId)).thenReturn(Optional.of(signatory));

        CertificateRequest request = new CertificateRequest(recipientId, signatoryId, "Certificate of Completion");

        assertThrows(IllegalArgumentException.class, () -> service.generate(orgId, request));

        verify(pdfService, never()).generateCertificate(
                any(),
                any(),
                any(),
                anyString(),
                anyString());
    }
}
