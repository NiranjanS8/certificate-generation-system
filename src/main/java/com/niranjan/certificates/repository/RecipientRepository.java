package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Recipient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipientRepository extends JpaRepository<Recipient, UUID> {

    List<Recipient> findAllByOrganizationId(UUID orgId);

    Optional<Recipient> findByIdAndOrganizationId(UUID id, UUID orgId);
}
