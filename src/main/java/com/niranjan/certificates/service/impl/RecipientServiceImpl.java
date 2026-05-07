package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.ListQuery;
import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.dto.response.PageResponse;
import com.niranjan.certificates.dto.response.RecipientResponse;
import com.niranjan.certificates.entity.Certificate;
import com.niranjan.certificates.entity.CertificateStatus;
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
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecipientServiceImpl implements RecipientService {

    private final RecipientRepository recipientRepository;
    private final OrganizationRepository organizationRepository;
    private final CourseRepository courseRepository;
    private final CertificateRepository certificateRepository;
    private static final Set<String> ALLOWED_SORTS = Set.of(
            "createdAt", "fullName", "email", "score", "grade", "completionDate", "courseName");
    private static final Map<String, String> SORT_ALIASES = Map.of("courseName", "course.name");

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
    public PageResponse<RecipientResponse> search(UUID orgId, ListQuery query) {
        Pageable pageable = query.toPageable("createdAt", ALLOWED_SORTS, SORT_ALIASES);
        return PageResponse.from(recipientRepository.findAll(recipientSpec(orgId, query), pageable), this::mapToResponse);
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

    private Specification<Recipient> recipientSpec(UUID orgId, ListQuery query) {
        return (root, criteriaQuery, cb) -> {
            var predicate = cb.equal(root.get("organization").get("id"), orgId);

            String search = query.normalizedSearch();
            if (search != null) {
                String pattern = "%" + search + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("course").get("name")), pattern)
                ));
            }

            if (query.getCourseId() != null) {
                predicate = cb.and(predicate, cb.equal(root.get("course").get("id"), query.getCourseId()));
            }

            String status = query.normalizedStatus();
            if (status != null && !"all".equals(status)) {
                Subquery<UUID> certificateSubquery = criteriaQuery.subquery(UUID.class);
                var certificateRoot = certificateSubquery.from(Certificate.class);
                certificateSubquery.select(certificateRoot.get("id"))
                        .where(
                                cb.equal(certificateRoot.get("organization").get("id"), orgId),
                                cb.equal(certificateRoot.get("recipient").get("id"), root.get("id"))
                        );

                if ("not_issued".equals(status) || "not issued".equals(status)) {
                    predicate = cb.and(predicate, cb.not(cb.exists(certificateSubquery)));
                } else {
                    certificateSubquery.where(
                            cb.equal(certificateRoot.get("organization").get("id"), orgId),
                            cb.equal(certificateRoot.get("recipient").get("id"), root.get("id")),
                            cb.equal(certificateRoot.get("status"), CertificateStatus.valueOf(status.toUpperCase()))
                    );
                    predicate = cb.and(predicate, cb.exists(certificateSubquery));
                }
            }

            return predicate;
        };
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
