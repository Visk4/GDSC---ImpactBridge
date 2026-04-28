package com.impactbridge.service;

import com.impactbridge.dto.HeatmapPoint;
import com.impactbridge.entity.HeatmapData;
import com.impactbridge.repository.HeatmapDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HeatmapService {

    private final HeatmapDataRepository heatmapDataRepository;

    public List<HeatmapPoint> getAllHeatmapData() {
        return heatmapDataRepository.findAll().stream()
                .map(this::toPoint)
                .collect(Collectors.toList());
    }

    public List<HeatmapPoint> getAspirationalDistricts() {
        return heatmapDataRepository.findByIsAspirationalTrue().stream()
                .map(this::toPoint)
                .collect(Collectors.toList());
    }

    private HeatmapPoint toPoint(HeatmapData data) {
        return HeatmapPoint.builder()
                .id(data.getId())
                .districtName(data.getDistrictName())
                .state(data.getState())
                .latitude(data.getLatitude())
                .longitude(data.getLongitude())
                .needScore(data.getNeedScore())
                .csrFundingReceived(data.getCsrFundingReceived())
                .ngoCount(data.getNgoCount())
                .opportunityScore(data.getOpportunityScore())
                .isAspirational(data.getIsAspirational())
                .build();
    }
}
