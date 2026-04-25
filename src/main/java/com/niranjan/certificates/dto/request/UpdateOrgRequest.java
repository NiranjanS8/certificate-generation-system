package com.niranjan.certificates.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrgRequest {

    @NotBlank(message = "Organization name is required")
    private String name;

    private String website;
}
