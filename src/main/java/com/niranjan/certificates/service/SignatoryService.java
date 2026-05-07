package com.niranjan.certificates.service;

import com.niranjan.certificates.dto.request.ListQuery;
import com.niranjan.certificates.dto.request.SignatoryRequest;
import com.niranjan.certificates.dto.response.PageResponse;
import com.niranjan.certificates.dto.response.SignatoryResponse;

import java.util.List;
import java.util.UUID;

public interface SignatoryService {

    SignatoryResponse create(UUID orgId, SignatoryRequest request);

    List<SignatoryResponse> getAll(UUID orgId);

    PageResponse<SignatoryResponse> search(UUID orgId, ListQuery query);

    SignatoryResponse getById(UUID orgId, UUID id);

    byte[] getSignatureImage(UUID orgId, UUID id);

    String getSignatureContentType(UUID orgId, UUID id);

    SignatoryResponse update(UUID orgId, UUID id, SignatoryRequest request);

    void delete(UUID orgId, UUID id);

    SignatoryResponse setDefault(UUID orgId, UUID signatoryId);

    SignatoryResponse updateSignatureUrl(UUID orgId, UUID id, String signatureUrl);
}
