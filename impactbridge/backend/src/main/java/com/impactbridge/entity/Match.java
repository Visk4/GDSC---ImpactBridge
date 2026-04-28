package com.impactbridge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "corporate_id", nullable = false)
    private UUID corporateId;

    @Column(name = "ngo_id", nullable = false)
    private UUID ngoId;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore;

    @Column(name = "geographic_score")
    @Builder.Default
    private Integer geographicScore = 0;

    @Column(name = "thematic_score")
    @Builder.Default
    private Integer thematicScore = 0;

    @Column(name = "budget_score")
    @Builder.Default
    private Integer budgetScore = 0;

    @Column(name = "compliance_score")
    @Builder.Default
    private Integer complianceScore = 0;

    @Column(name = "impact_density_score")
    @Builder.Default
    private Integer impactDensityScore = 0;

    @Column(name = "compliance_note", columnDefinition = "TEXT")
    private String complianceNote;

    @Column(name = "outcome_notes", columnDefinition = "TEXT")
    private String outcomeNotes;

    @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Transient fields for response enrichment
    @Transient
    private Ngo ngo;

    @Transient
    private Corporate corporate;
}
