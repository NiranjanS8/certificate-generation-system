package com.niranjan.certificates.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipientRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String email;

    @NotNull(message = "Course ID is required")
    private UUID courseId;

    @Min(value = 0, message = "Score cannot be less than 0")
    @Max(value = 100, message = "Score cannot be greater than 100")
    private Integer score;

    private String grade;

    @NotNull(message = "Completion date is required")
    private String completionDate; // format: yyyy-MM-dd
}
