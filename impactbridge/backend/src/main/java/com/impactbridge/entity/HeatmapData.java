package com.impactbridge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "heatmap_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeatmapData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "district_name", nullable = false)
    private String districtName;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "need_score")
    @Builder.Default
    private Integer needScore = 0;

    @Column(name = "csr_funding_received")
    @Builder.Default
    private Long csrFundingReceived = 0L;

    @Column(name = "ngo_count")
    @Builder.Default
    private Integer ngoCount = 0;

    @Column(name = "opportunity_score")
    @Builder.Default
    private Integer opportunityScore = 0;

    @Column(name = "is_aspirational")
    @Builder.Default
    private Boolean isAspirational = false;
}
