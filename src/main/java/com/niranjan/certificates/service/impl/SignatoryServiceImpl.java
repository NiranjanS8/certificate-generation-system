package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.SignatoryRequest;
import com.niranjan.certificates.dto.response.SignatoryResponse;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Signatory;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.SignatoryRepository;
import com.niranjan.certificates.service.SignatoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SignatoryServiceImpl implements SignatoryService {

    private final SignatoryRepository signatoryRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    public SignatoryResponse create(UUID orgId, SignatoryRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        Signatory signatory = Signatory.builder()
                .organization(org)
                .name(request.getName())
                .title(request.getTitle())
                .isDefault(false)
                .build();

        Signatory saved = signatoryRepository.save(signatory);
        return mapToResponse(saved);
    }

    @Override
    public List<SignatoryResponse> getAll(UUID orgId) {
        return signatoryRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public SignatoryResponse getById(UUID orgId, UUID id) {
        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", id));
        return mapToResponse(signatory);
    }

    @Override
    public byte[] getSignatureImage(UUID orgId, UUID id) {
        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", id));
        if (signatory.getSignatureUrl() == null || signatory.getSignatureUrl().isBlank()) {
            throw new ResourceNotFoundException("Signature", "signatoryId", id);
        }
        Path path = Paths.get(signatory.getSignatureUrl());
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read signature image file", e);
        }
    }

    @Override
    public String getSignatureContentType(UUID orgId, UUID id) {
        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", id));
        if (signatory.getSignatureUrl() == null || signatory.getSignatureUrl().isBlank()) {
            throw new ResourceNotFoundException("Signature", "signatoryId", id);
        }
        Path path = Paths.get(signatory.getSignatureUrl());
        try {
            String contentType = Files.probeContentType(path);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (IOException e) {
            throw new RuntimeException("Failed to inspect signature image file", e);
        }
    }

    @Override
    public SignatoryResponse update(UUID orgId, UUID id, SignatoryRequest request) {
        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", id));

        signatory.setName(request.getName());
        signatory.setTitle(request.getTitle());

        Signatory saved = signatoryRepository.save(signatory);
        return mapToResponse(saved);
    }

    @Override
    public void delete(UUID orgId, UUID id) {
        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", id));
        signatoryRepository.delete(signatory);
    }

    @Override
    @Transactional
    public SignatoryResponse setDefault(UUID orgId, UUID signatoryId) {
        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(signatoryId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", signatoryId));

        // Clear all defaults for this org, then set the chosen one
        List<Signatory> allSignatories = signatoryRepository.findAllByOrganizationId(orgId);
        allSignatories.forEach(s -> s.setIsDefault(false));
        signatoryRepository.saveAll(allSignatories);

        signatory.setIsDefault(true);
        Signatory saved = signatoryRepository.save(signatory);
        return mapToResponse(saved);
    }

    @Override
    public SignatoryResponse updateSignatureUrl(UUID orgId, UUID id, String signatureUrl) {
        Signatory signatory = signatoryRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Signatory", "id", id));

        signatory.setSignatureUrl(signatureUrl);
        Signatory saved = signatoryRepository.save(signatory);
        return mapToResponse(saved);
    }

    private SignatoryResponse mapToResponse(Signatory signatory) {
        return SignatoryResponse.builder()
                .id(signatory.getId())
                .orgId(signatory.getOrganization().getId())
                .name(signatory.getName())
                .title(signatory.getTitle())
                .signatureUrl(signatory.getSignatureUrl())
                .isDefault(signatory.getIsDefault())
                .build();
    }
}
