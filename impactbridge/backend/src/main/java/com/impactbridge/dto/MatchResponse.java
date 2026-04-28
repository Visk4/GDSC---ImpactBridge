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
public class MatchResponse {

    private UUID id;
    private UUID corporateId;
    private UUID ngoId;

    // NGO details (denormalized for frontend convenience)
    private String ngoName;
    private String ngoState;
    private String ngoDistrict;
    private String ngoTheme;
    private String ngoRegistrationType;
    private Integer ngoBeneficiaries;
    private Boolean ngoIsAspirational;
    private String ngoVerificationStatus;
    private Map<String, Object> ngoProposal;

    // Scores
    private Integer overallScore;
    private Integer geographicScore;
    private Integer thematicScore;
    private Integer budgetScore;
    private Integer complianceScore;
    private Integer impactDensityScore;

    private String complianceNote;
    private String outcomeNotes;
    private String status;

    // Derived from proposal
    private String scheduleViiCategory;
    private Long budgetRequired;
    private List<String> sdgTags;
}
