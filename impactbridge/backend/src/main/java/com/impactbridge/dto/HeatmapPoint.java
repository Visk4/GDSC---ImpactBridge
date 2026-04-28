package com.impactbridge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapPoint {

    private UUID id;
    private String districtName;
    private String state;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer needScore;
    private Long csrFundingReceived;
    private Integer ngoCount;
    private Integer opportunityScore;
    private Boolean isAspirational;
}
