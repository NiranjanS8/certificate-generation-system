package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.dto.response.RecipientResponse;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.exception.ResourceNotFoundException;
import com.niranjan.certificates.repository.OrganizationRepository;
import com.niranjan.certificates.repository.RecipientRepository;
import com.niranjan.certificates.service.RecipientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecipientServiceImpl implements RecipientService {

    private final RecipientRepository recipientRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    public RecipientResponse create(UUID orgId, RecipientRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        Recipient recipient = Recipient.builder()
                .organization(org)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .courseName(request.getCourseName())
                .score(request.getScore())
                .grade(request.getGrade())
                .completionDate(LocalDate.parse(request.getCompletionDate()))
                .build();

        Recipient saved = recipientRepository.save(recipient);
        return mapToResponse(saved);
    }

    @Override
    public List<RecipientResponse> getAll(UUID orgId) {
        return recipientRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public RecipientResponse getById(UUID orgId, UUID id) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));
        return mapToResponse(recipient);
    }

    @Override
    public RecipientResponse update(UUID orgId, UUID id, RecipientRequest request) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));

        recipient.setFullName(request.getFullName());
        recipient.setEmail(request.getEmail());
        recipient.setCourseName(request.getCourseName());
        recipient.setScore(request.getScore());
        recipient.setGrade(request.getGrade());
        recipient.setCompletionDate(LocalDate.parse(request.getCompletionDate()));

        Recipient saved = recipientRepository.save(recipient);
        return mapToResponse(saved);
    }

    @Override
    public void delete(UUID orgId, UUID id) {
        Recipient recipient = recipientRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient", "id", id));
        recipientRepository.delete(recipient);
    }

    private RecipientResponse mapToResponse(Recipient recipient) {
        return RecipientResponse.builder()
                .id(recipient.getId())
                .orgId(recipient.getOrganization().getId())
                .fullName(recipient.getFullName())
                .email(recipient.getEmail())
                .courseName(recipient.getCourseName())
                .score(recipient.getScore())
                .grade(recipient.getGrade())
                .completionDate(recipient.getCompletionDate())
                .createdAt(recipient.getCreatedAt())
                .build();
    }
}
