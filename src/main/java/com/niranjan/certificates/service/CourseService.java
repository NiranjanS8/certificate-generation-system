package com.niranjan.certificates.service;

import com.niranjan.certificates.dto.request.CourseRequest;
import com.niranjan.certificates.dto.request.ListQuery;
import com.niranjan.certificates.dto.response.CourseResponse;
import com.niranjan.certificates.dto.response.PageResponse;

import java.util.List;
import java.util.UUID;

public interface CourseService {

    CourseResponse create(UUID orgId, CourseRequest request);

    List<CourseResponse> getAll(UUID orgId);

    PageResponse<CourseResponse> search(UUID orgId, ListQuery query);

    CourseResponse getById(UUID orgId, UUID id);

    CourseResponse update(UUID orgId, UUID id, CourseRequest request);

    void deactivate(UUID orgId, UUID id);
}
