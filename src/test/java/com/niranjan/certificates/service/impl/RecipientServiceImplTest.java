package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.entity.Course;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.exception.DuplicateResourceException;
import com.niranjan.certificates.repository.CertificateRepository;
import com.niranjan.certificates.repository.CourseRepository;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.RecipientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecipientServiceImplTest {

    private final RecipientRepository recipientRepository = mock(RecipientRepository.class);
    private final OrganizationRepository organizationRepository = mock(OrganizationRepository.class);
    private final CourseRepository courseRepository = mock(CourseRepository.class);
    private final CertificateRepository certificateRepository = mock(CertificateRepository.class);

    private final RecipientServiceImpl service = new RecipientServiceImpl(
            recipientRepository,
            organizationRepository,
            courseRepository,
            certificateRepository);

    @Test
    void createRejectsInactiveCourse() {
        UUID orgId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

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

        RecipientRequest request = new RecipientRequest(
                "John Doe",
                "john@example.com",
                courseId,
                95,
                "A",
                "2026-04-27");

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(courseRepository.findByIdAndOrganizationId(courseId, orgId)).thenReturn(Optional.of(course));

        assertThrows(IllegalArgumentException.class, () -> service.create(orgId, request));

        verify(recipientRepository, never()).save(org.mockito.Mockito.any());
    }

    @Test
    void updateRejectsCourseChangeAfterCertificateIssued() {
        UUID orgId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID currentCourseId = UUID.randomUUID();
        UUID newCourseId = UUID.randomUUID();

        Organization organization = Organization.builder()
                .id(orgId)
                .name("Acme")
                .build();

        Course currentCourse = Course.builder()
                .id(currentCourseId)
                .organization(organization)
                .name("Web Development")
                .build();

        Course newCourse = Course.builder()
                .id(newCourseId)
                .organization(organization)
                .name("Data Science")
                .build();

        Recipient recipient = Recipient.builder()
                .id(recipientId)
                .organization(organization)
                .course(currentCourse)
                .fullName("John Doe")
                .completionDate(LocalDate.now())
                .build();

        RecipientRequest request = new RecipientRequest(
                "John Doe",
                "john@example.com",
                newCourseId,
                95,
                "A",
                "2026-04-27");

        when(recipientRepository.findByIdAndOrganizationId(recipientId, orgId)).thenReturn(Optional.of(recipient));
        when(courseRepository.findByIdAndOrganizationId(newCourseId, orgId)).thenReturn(Optional.of(newCourse));
        when(certificateRepository.existsByOrganizationIdAndRecipientId(orgId, recipientId)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> service.update(orgId, recipientId, request));

        verify(recipientRepository, never()).save(recipient);
    }

    @Test
    void updateRejectsInactiveCourse() {
        UUID orgId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        UUID currentCourseId = UUID.randomUUID();
        UUID inactiveCourseId = UUID.randomUUID();

        Organization organization = Organization.builder()
                .id(orgId)
                .name("Acme")
                .build();

        Course currentCourse = Course.builder()
                .id(currentCourseId)
                .organization(organization)
                .name("Web Development")
                .build();

        Course inactiveCourse = Course.builder()
                .id(inactiveCourseId)
                .organization(organization)
                .name("Archived Course")
                .isActive(false)
                .build();

        Recipient recipient = Recipient.builder()
                .id(recipientId)
                .organization(organization)
                .course(currentCourse)
                .fullName("John Doe")
                .completionDate(LocalDate.now())
                .build();

        RecipientRequest request = new RecipientRequest(
                "John Doe",
                "john@example.com",
                inactiveCourseId,
                95,
                "A",
                "2026-04-27");

        when(recipientRepository.findByIdAndOrganizationId(recipientId, orgId)).thenReturn(Optional.of(recipient));
        when(courseRepository.findByIdAndOrganizationId(inactiveCourseId, orgId)).thenReturn(Optional.of(inactiveCourse));

        assertThrows(IllegalArgumentException.class, () -> service.update(orgId, recipientId, request));

        verify(recipientRepository, never()).save(recipient);
    }
}
