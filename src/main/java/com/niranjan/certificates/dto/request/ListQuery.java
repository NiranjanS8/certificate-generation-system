package com.niranjan.certificates.dto.request;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
public class ListQuery {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 25;
    private static final int MAX_SIZE = 100;

    private int page = DEFAULT_PAGE;
    private int size = DEFAULT_SIZE;
    private String search;
    private String status;
    private UUID courseId;
    private String sort;
    private String direction = "desc";

    public Pageable toPageable(String defaultSort, Set<String> allowedSorts, Map<String, String> sortAliases) {
        int safePage = Math.max(page, DEFAULT_PAGE);
        int safeSize = Math.max(1, Math.min(size, MAX_SIZE));
        String requestedSort = normalize(sort);
        String sortProperty = defaultSort;

        if (requestedSort != null && allowedSorts.contains(requestedSort)) {
            sortProperty = sortAliases.getOrDefault(requestedSort, requestedSort);
        }

        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(safePage, safeSize, Sort.by(sortDirection, sortProperty));
    }

    public String normalizedSearch() {
        return normalize(search);
    }

    public String normalizedStatus() {
        return normalize(status);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase();
    }
}
