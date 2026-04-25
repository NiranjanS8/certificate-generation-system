package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Signatory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SignatoryRepository extends JpaRepository<Signatory, UUID> {

    List<Signatory> findAllByOrganizationId(UUID orgId);

    Optional<Signatory> findByIdAndOrganizationId(UUID id, UUID orgId);
}
