package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findByOrganizationIdAndIsActiveTrue(UUID orgId);

    Optional<Course> findByIdAndOrganizationId(UUID id, UUID orgId);
}
