package com.niranjan.certificates.service;

import com.niranjan.certificates.dto.request.ListQuery;
import com.niranjan.certificates.dto.request.RecipientRequest;
import com.niranjan.certificates.dto.response.PageResponse;
import com.niranjan.certificates.dto.response.RecipientResponse;

import java.util.List;
import java.util.UUID;

public interface RecipientService {

    RecipientResponse create(UUID orgId, RecipientRequest request);

    List<RecipientResponse> getAll(UUID orgId);

    PageResponse<RecipientResponse> search(UUID orgId, ListQuery query);

    RecipientResponse getById(UUID orgId, UUID id);

    RecipientResponse update(UUID orgId, UUID id, RecipientRequest request);

    void delete(UUID orgId, UUID id);
}
