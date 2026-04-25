package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Recipient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RecipientRepository extends JpaRepository<Recipient, UUID> {
}
