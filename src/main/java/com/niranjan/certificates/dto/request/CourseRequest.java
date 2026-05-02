package com.niranjan.certificates.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    @NotBlank(message = "Course name is required")
    private String name;

    private String description;

    @Min(value = 0, message = "Minimum score cannot be less than 0")
    @Max(value = 100, message = "Minimum score cannot be greater than 100")
    private Integer minScore = 0;
}
