package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.CourseRequest;
import com.niranjan.certificates.dto.response.CourseResponse;
import com.niranjan.certificates.entity.Course;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.CourseRepository;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    public CourseResponse create(UUID orgId, CourseRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        Course course = Course.builder()
                .organization(org)
                .name(request.getName())
                .description(request.getDescription())
                .minScore(request.getMinScore() != null ? request.getMinScore() : 0)
                .build();

        Course saved = courseRepository.save(course);
        return mapToResponse(saved);
    }

    @Override
    public List<CourseResponse> getAll(UUID orgId) {
        return courseRepository.findByOrganizationIdAndIsActiveTrue(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CourseResponse getById(UUID orgId, UUID id) {
        Course course = courseRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        return mapToResponse(course);
    }

    @Override
    public CourseResponse update(UUID orgId, UUID id, CourseRequest request) {
        Course course = courseRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setMinScore(request.getMinScore() != null ? request.getMinScore() : 0);

        Course saved = courseRepository.save(course);
        return mapToResponse(saved);
    }

    @Override
    public void deactivate(UUID orgId, UUID id) {
        Course course = courseRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        course.setIsActive(false);
        courseRepository.save(course);
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .orgId(course.getOrganization().getId())
                .name(course.getName())
                .description(course.getDescription())
                .minScore(course.getMinScore())
                .isActive(course.getIsActive())
                .createdAt(course.getCreatedAt())
                .build();
    }
}
