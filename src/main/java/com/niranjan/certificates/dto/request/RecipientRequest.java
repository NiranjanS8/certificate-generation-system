package com.niranjan.certificates.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipientRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String email;

    @NotBlank(message = "Course name is required")
    private String courseName;

    private Integer score;

    private String grade;

    @NotNull(message = "Completion date is required")
    private String completionDate; // format: yyyy-MM-dd
}
