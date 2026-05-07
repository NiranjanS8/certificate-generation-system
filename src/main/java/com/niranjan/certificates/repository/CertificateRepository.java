package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Certificate;
import com.niranjan.certificates.entity.CertificateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID>, JpaSpecificationExecutor<Certificate> {

    List<Certificate> findAllByOrganizationId(UUID orgId);

    Optional<Certificate> findByIdAndOrganizationId(UUID id, UUID orgId);

    Optional<Certificate> findByUniqueCode(String uniqueCode);

    Optional<Certificate> findByOrganizationIdAndRecipientIdAndRecipientCourseIdAndStatus(
            UUID orgId, UUID recipientId, UUID courseId, CertificateStatus status);

    boolean existsByUniqueCode(String uniqueCode);

    boolean existsByOrganizationIdAndRecipientId(UUID orgId, UUID recipientId);

    boolean existsByOrganizationIdAndRecipientIdAndIdNot(UUID orgId, UUID recipientId, UUID id);
}
