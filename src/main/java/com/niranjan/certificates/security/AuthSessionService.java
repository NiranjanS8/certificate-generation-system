package com.niranjan.certificates.security;

import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private final OrganizationRepository organizationRepository;

    @Transactional
    public OrganizationPrincipal rotateSession(OrganizationPrincipal principal) {
        Organization organization = organizationRepository.findById(principal.getOrgId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", principal.getOrgId()));

        organization.setCurrentAuthSessionId(UUID.randomUUID().toString());
        Organization saved = organizationRepository.save(organization);
        return new OrganizationPrincipal(saved);
    }
}
