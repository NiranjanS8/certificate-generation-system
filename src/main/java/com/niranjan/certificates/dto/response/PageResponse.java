package com.niranjan.certificates.dto.response;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

@Data
@Builder
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private String sort;
    private String direction;

    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> mapper) {
        String sortProperty = page.getSort().stream()
                .findFirst()
                .map(order -> order.getProperty())
                .orElse(null);
        String sortDirection = page.getSort().stream()
                .findFirst()
                .map(order -> order.getDirection().name().toLowerCase())
                .orElse(null);

        return PageResponse.<T>builder()
                .content(page.getContent().stream().map(mapper).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .sort(sortProperty)
                .direction(sortDirection)
                .build();
    }
}
