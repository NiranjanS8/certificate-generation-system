package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.RegisterRequest;
import com.niranjan.certificates.dto.request.UpdateOrgRequest;
import com.niranjan.certificates.dto.response.OrganizationResponse;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.exception.DuplicateResourceException;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;

    @Override
    public OrganizationResponse register(RegisterRequest request) {
        if (organizationRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Organization", "email", request.getEmail());
        }

        Organization org = Organization.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(request.getPassword()) // plain text — no security phase
                .website(request.getWebsite())
                .build();

        Organization saved = organizationRepository.save(org);
        return mapToResponse(saved);
    }

    @Override
    public OrganizationResponse getProfile(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));
        return mapToResponse(org);
    }

    @Override
    public OrganizationResponse updateProfile(UUID orgId, UpdateOrgRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        org.setName(request.getName());
        org.setWebsite(request.getWebsite());

        Organization saved = organizationRepository.save(org);
        return mapToResponse(saved);
    }

    @Override
    public OrganizationResponse updateLogo(UUID orgId, String logoUrl) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        org.setLogoUrl(logoUrl);

        Organization saved = organizationRepository.save(org);
        return mapToResponse(saved);
    }

    private OrganizationResponse mapToResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .email(org.getEmail())
                .website(org.getWebsite())
                .logoUrl(org.getLogoUrl())
                .createdAt(org.getCreatedAt())
                .build();
    }
}

