package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Recipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipientRepository extends JpaRepository<Recipient, UUID>, JpaSpecificationExecutor<Recipient> {

    List<Recipient> findAllByOrganizationId(UUID orgId);

    Optional<Recipient> findByIdAndOrganizationId(UUID id, UUID orgId);
}
