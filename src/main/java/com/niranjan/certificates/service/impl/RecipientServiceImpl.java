package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.dto.response.RecipientResponse;
import com.niranjan.certificates.entity.Course;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.exception.DuplicateResourceException;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.CertificateRepository;
import com.niranjan.certificates.repository.CourseRepository;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.RecipientRepository;
import com.niranjan.certificates.service.RecipientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecipientServiceImpl implements RecipientService {

    private final RecipientRepository recipientRepository;
    private final OrganizationRepository organizationRepository;
    private final CourseRepository courseRepository;
    private final CertificateRepository certificateRepository;

    @Override
    @Transactional
    public RecipientResponse create(UUID orgId, RecipientRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        Course course = courseRepository.findByIdAndOrganizationId(request.getCourseId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));
        validateActiveCourse(course);

        Recipient recipient = Recipient.builder()
                .organization(org)
                .course(course)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .score(request.getScore())
                .grade(request.getGrade())
                .completionDate(parseDate(request.getCompletionDate()))
                .build();

        Recipient saved = recipientRepository.save(recipient);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecipientResponse> getAll(UUID orgId) {
        return recipientRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RecipientResponse getById(UUID orgId, UUID id) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));
        return mapToResponse(recipient);
    }

    @Override
    @Transactional
    public RecipientResponse update(UUID orgId, UUID id, RecipientRequest request) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));

        Course course = courseRepository.findByIdAndOrganizationId(request.getCourseId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));
        validateActiveCourse(course);

        if (!recipient.getCourse().getId().equals(course.getId())
                && certificateRepository.existsByOrganizationIdAndRecipientId(orgId, recipient.getId())) {
            throw new DuplicateResourceException(
                    "Cannot change recipient course after a certificate has been issued");
        }

        LocalDate completionDate = parseDate(request.getCompletionDate());
        validateCertificateLockedFields(orgId, recipient, course, request, completionDate);

        recipient.setCourse(course);
        recipient.setFullName(request.getFullName());
        recipient.setEmail(request.getEmail());
        recipient.setScore(request.getScore());
        recipient.setGrade(request.getGrade());
        recipient.setCompletionDate(completionDate);

        Recipient saved = recipientRepository.save(recipient);
        return mapToResponse(saved);
    }

    @Override
    public void delete(UUID orgId, UUID id) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));
        if (certificateRepository.existsByOrganizationIdAndRecipientId(orgId, recipient.getId())) {
            throw new DuplicateResourceException(
                    "Cannot delete recipient after a certificate has been issued");
        }
        recipientRepository.delete(recipient);
    }

    private RecipientResponse mapToResponse(Recipient recipient) {
        return RecipientResponse.builder()
                .id(recipient.getId())
                .orgId(recipient.getOrganization().getId())
                .courseId(recipient.getCourse().getId())
                .courseName(recipient.getCourse().getName())
                .fullName(recipient.getFullName())
                .email(recipient.getEmail())
                .score(recipient.getScore())
                .grade(recipient.getGrade())
                .completionDate(recipient.getCompletionDate())
                .createdAt(recipient.getCreatedAt())
                .build();
    }

    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Invalid date format: '" + dateStr + "'. Expected format: yyyy-MM-dd");
        }
    }

    private void validateActiveCourse(Course course) {
        if (Boolean.FALSE.equals(course.getIsActive())) {
            throw new IllegalArgumentException("Cannot assign recipient to inactive course: " + course.getName());
        }
    }

    private void validateCertificateLockedFields(UUID orgId, Recipient recipient, Course course,
                                                 RecipientRequest request, LocalDate completionDate) {
        if (!certificateRepository.existsByOrganizationIdAndRecipientId(orgId, recipient.getId())) {
            return;
        }

        boolean certificateDetailsChanged =
                !Objects.equals(recipient.getCourse().getId(), course.getId())
                        || !Objects.equals(recipient.getScore(), request.getScore())
                        || !Objects.equals(recipient.getGrade(), request.getGrade())
                        || !Objects.equals(recipient.getCompletionDate(), completionDate);

        if (certificateDetailsChanged) {
            throw new IllegalArgumentException(
                    "Course, score, grade, and completion date cannot be changed after a certificate is issued.");
        }
    }
}
