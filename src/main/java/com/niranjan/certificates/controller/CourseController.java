package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.CourseRequest;
import com.niranjan.certificates.dto.response.CourseResponse;
import com.niranjan.certificates.security.OrganizationPrincipal;
import com.niranjan.certificates.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    public ResponseEntity<CourseResponse> create(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                 @Valid @RequestBody CourseRequest request) {
        CourseResponse response = courseService.create(principal.getOrgId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAll(@AuthenticationPrincipal OrganizationPrincipal principal) {
        return ResponseEntity.ok(courseService.getAll(principal.getOrgId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getById(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                  @PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getById(principal.getOrgId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> update(@AuthenticationPrincipal OrganizationPrincipal principal,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.update(principal.getOrgId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@AuthenticationPrincipal OrganizationPrincipal principal,
                                           @PathVariable UUID id) {
        courseService.deactivate(principal.getOrgId(), id);
        return ResponseEntity.noContent().build();
    }
}
