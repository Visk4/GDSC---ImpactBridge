package com.impactbridge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStats {

    private long ngoCount;
    private long corporateCount;
    private long matchCount;
    private long interestedCount;
    private long fundedCount;
    private long totalBeneficiaries;
    private long aspirationalDistrictsServed;
}
