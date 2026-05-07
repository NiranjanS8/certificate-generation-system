package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Signatory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SignatoryRepository extends JpaRepository<Signatory, UUID>, JpaSpecificationExecutor<Signatory> {

    List<Signatory> findAllByOrganizationId(UUID orgId);

    Optional<Signatory> findByIdAndOrganizationId(UUID id, UUID orgId);
}
