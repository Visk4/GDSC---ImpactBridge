package com.impactbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class NgoRequest {

    @NotBlank(message = "NGO name is required")
    private String name;

    @NotBlank(message = "Registration type is required")
    private String registrationType;

    @NotBlank(message = "State is required")
    private String state;

    private String district;

    @NotBlank(message = "Theme is required")
    private String theme;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Years active is required")
    @Positive
    private Integer yearsActive;

    @NotNull(message = "Annual beneficiaries is required")
    @Positive
    private Integer annualBeneficiaries;

    private String website;
    private String contactEmail;
}
