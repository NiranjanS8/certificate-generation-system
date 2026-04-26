package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.dto.response.RecipientResponse;
import com.niranjan.certificates.entity.Course;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.CourseRepository;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.RecipientRepository;
import com.niranjan.certificates.service.RecipientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecipientServiceImpl implements RecipientService {

    private final RecipientRepository recipientRepository;
    private final OrganizationRepository organizationRepository;
    private final CourseRepository courseRepository;

    @Override
    public RecipientResponse create(UUID orgId, RecipientRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        Course course = courseRepository.findByIdAndOrganizationId(request.getCourseId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        Recipient recipient = Recipient.builder()
                .organization(org)
                .course(course)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .score(request.getScore())
                .grade(request.getGrade())
                .completionDate(LocalDate.parse(request.getCompletionDate()))
                .build();

        Recipient saved = recipientRepository.save(recipient);
        return mapToResponse(saved);
    }

    @Override
    public List<RecipientResponse> getAll(UUID orgId) {
        return recipientRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public RecipientResponse getById(UUID orgId, UUID id) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));
        return mapToResponse(recipient);
    }

    @Override
    public RecipientResponse update(UUID orgId, UUID id, RecipientRequest request) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));

        Course course = courseRepository.findByIdAndOrganizationId(request.getCourseId(), orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        recipient.setCourse(course);
        recipient.setFullName(request.getFullName());
        recipient.setEmail(request.getEmail());
        recipient.setScore(request.getScore());
        recipient.setGrade(request.getGrade());
        recipient.setCompletionDate(LocalDate.parse(request.getCompletionDate()));

        Recipient saved = recipientRepository.save(recipient);
        return mapToResponse(saved);
    }

    @Override
    public void delete(UUID orgId, UUID id) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));
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
}
