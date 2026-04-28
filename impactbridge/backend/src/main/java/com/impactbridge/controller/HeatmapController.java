package com.impactbridge.controller;

import com.impactbridge.dto.HeatmapPoint;
import com.impactbridge.service.HeatmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/heatmap")
@RequiredArgsConstructor
public class HeatmapController {

    private final HeatmapService heatmapService;

    @GetMapping
    public ResponseEntity<List<HeatmapPoint>> getAllHeatmapData() {
        return ResponseEntity.ok(heatmapService.getAllHeatmapData());
    }

    @GetMapping("/aspirational")
    public ResponseEntity<List<HeatmapPoint>> getAspirationalDistricts() {
        return ResponseEntity.ok(heatmapService.getAspirationalDistricts());
    }
}
