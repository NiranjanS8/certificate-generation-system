package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {

    List<Certificate> findAllByOrganizationId(UUID orgId);

    Optional<Certificate> findByIdAndOrganizationId(UUID id, UUID orgId);

    Optional<Certificate> findByUniqueCode(String uniqueCode);

    boolean existsByUniqueCode(String uniqueCode);

    boolean existsByOrganizationIdAndRecipientId(UUID orgId, UUID recipientId);
}
