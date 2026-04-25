package com.niranjan.certificates.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignatoryRequest {

    @NotBlank(message = "Signatory name is required")
    private String name;

    private String title;
}
