package com.niranjan.certificates.controller;

import com.niranjan.certificates.dto.request.CourseRequest;
import com.niranjan.certificates.dto.response.CourseResponse;
import com.niranjan.certificates.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    public ResponseEntity<CourseResponse> create(@RequestHeader("X-Org-Id") UUID orgId,
                                                 @Valid @RequestBody CourseRequest request) {
        CourseResponse response = courseService.create(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAll(@RequestHeader("X-Org-Id") UUID orgId) {
        return ResponseEntity.ok(courseService.getAll(orgId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getById(@RequestHeader("X-Org-Id") UUID orgId,
                                                  @PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getById(orgId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> update(@RequestHeader("X-Org-Id") UUID orgId,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.update(orgId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@RequestHeader("X-Org-Id") UUID orgId,
                                           @PathVariable UUID id) {
        courseService.deactivate(orgId, id);
        return ResponseEntity.noContent().build();
    }
}
