package com.impactbridge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NgoResponse {

    private UUID id;
    private String name;
    private String registrationType;
    private String state;
    private String district;
    private String theme;
    private String description;
    private Integer yearsActive;
    private Integer annualBeneficiaries;
    private String website;
    private String contactEmail;
    private Map<String, Object> generatedProposal;
    private Integer credibilityScore;
    private String scheduleViiCategory;
    private List<String> sdgTags;
    private Boolean isAspirationalDistrict;
    private Boolean isPublished;
}
