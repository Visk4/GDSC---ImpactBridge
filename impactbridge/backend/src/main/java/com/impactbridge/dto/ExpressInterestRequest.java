package com.impactbridge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpressInterestRequest {

    private String corporateId;
    private String ngoId;
    private String matchId;
}
