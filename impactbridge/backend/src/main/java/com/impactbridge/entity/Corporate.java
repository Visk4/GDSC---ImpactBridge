package com.impactbridge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "corporates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Corporate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String sector;

    @Column(name = "csr_budget", nullable = false)
    private Long csrBudget;

    @Column(name = "focus_theme", nullable = false)
    private String focusTheme;

    @Column(name = "preferred_state")
    private String preferredState;

    @Column(name = "requires_fcra")
    @Builder.Default
    private Boolean requiresFcra = false;

    @Column(name = "contact_email")
    private String contactEmail;

    // ── Verification fields ──────────────────────────────────
    @Column(name = "cin_number")
    private String cinNumber;

    @Column(name = "gstin")
    private String gstin;

    @Column(name = "verification_status")
    @Builder.Default
    private String verificationStatus = "UNVERIFIED";
    // UNVERIFIED / PENDING / VERIFIED / REJECTED

    @Column(name = "verification_source")
    private String verificationSource;
    // MCA21 / GST / SELF_DECLARED

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    @Column(name = "csr_policy_text", columnDefinition = "TEXT")
    private String csrPolicyText;
    // ────────────────────────────────────────────────────────

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}