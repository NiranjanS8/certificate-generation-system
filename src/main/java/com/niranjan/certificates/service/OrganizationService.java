package com.niranjan.certificates.service;

import com.niranjan.certificates.dto.request.RegisterRequest;
import com.niranjan.certificates.dto.request.UpdateOrgRequest;
import com.niranjan.certificates.dto.response.OrganizationResponse;

import java.util.UUID;

public interface OrganizationService {

    OrganizationResponse register(RegisterRequest request);

    OrganizationResponse getProfile(UUID orgId);

    OrganizationResponse updateProfile(UUID orgId, UpdateOrgRequest request);

    OrganizationResponse updateLogo(UUID orgId, String logoUrl);

    byte[] getLogoImage(UUID orgId);

    String getLogoContentType(UUID orgId);
}
