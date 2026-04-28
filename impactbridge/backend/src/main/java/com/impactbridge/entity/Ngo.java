package com.impactbridge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ngos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ngo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "registration_type", nullable = false)
    private String registrationType;

    @Column(nullable = false)
    private String state;

    private String district;

    @Column(nullable = false)
    private String theme;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "years_active")
    @Builder.Default
    private Integer yearsActive = 1;

    @Column(name = "annual_beneficiaries")
    @Builder.Default
    private Integer annualBeneficiaries = 0;

    private String website;

    @Column(name = "contact_email")
    private String contactEmail;

    // ── Verification fields ──────────────────────────────────
    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "pan_number")
    private String panNumber;

    @Column(name = "verification_status")
    @Builder.Default
    private String verificationStatus = "UNVERIFIED";
    // UNVERIFIED / PENDING / VERIFIED / REJECTED

    @Column(name = "verification_source")
    private String verificationSource;
    // NGO_DARPAN / MCA21 / MANUAL / SELF_DECLARED

    @Column(name = "ngo_darpan_id")
    private String ngoDarpanId;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;
    // ────────────────────────────────────────────────────────

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "generated_proposal", columnDefinition = "TEXT")
    private Map<String, Object> generatedProposal;

    @Column(name = "credibility_score")
    @Builder.Default
    private Integer credibilityScore = 0;

    @Column(name = "schedule_vii_category")
    private String scheduleViiCategory;

    @Column(name = "sdg_tags", columnDefinition = "TEXT")
    private String sdgTagsRaw;

    @Column(name = "is_aspirational_district")
    @Builder.Default
    private Boolean isAspirationalDistrict = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_published")
    @Builder.Default
    private Boolean isPublished = false;

    @Transient
    public java.util.List<String> getSdgTags() {
        if (sdgTagsRaw == null || sdgTagsRaw.isBlank())
            return java.util.List.of();
        return java.util.Arrays.asList(sdgTagsRaw.split(","));
    }

    public void setSdgTags(java.util.List<String> tags) {
        this.sdgTagsRaw = (tags == null || tags.isEmpty()) ? null : String.join(",", tags);
    }
}