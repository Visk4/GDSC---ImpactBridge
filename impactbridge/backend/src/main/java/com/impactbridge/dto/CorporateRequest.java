package com.impactbridge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CorporateRequest {

    @NotBlank(message = "Company name is required")
    private String name;

    @NotBlank(message = "Sector is required")
    private String sector;

    @NotNull(message = "CSR budget is required")
    @Positive
    private Long csrBudget;

    @NotBlank(message = "Focus theme is required")
    private String focusTheme;

    private String preferredState;
    private Boolean requiresFcra;
    private String contactEmail;
}
