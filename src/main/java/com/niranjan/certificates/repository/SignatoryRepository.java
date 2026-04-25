package com.niranjan.certificates.repository;

import com.niranjan.certificates.entity.Signatory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SignatoryRepository extends JpaRepository<Signatory, UUID> {
}
