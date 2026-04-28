package com.impactbridge.controller;

import com.impactbridge.dto.PlatformStats;
import com.impactbridge.entity.Ngo;
import com.impactbridge.repository.CorporateRepository;
import com.impactbridge.repository.MatchRepository;
import com.impactbridge.repository.NgoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final NgoRepository ngoRepository;
    private final CorporateRepository corporateRepository;
    private final MatchRepository matchRepository;

    @GetMapping
    public ResponseEntity<PlatformStats> getStats() {
        long ngoCount = ngoRepository.count();
        long corporateCount = corporateRepository.count();
        long matchCount = matchRepository.count();
        long interestedCount = matchRepository.countByStatus("INTERESTED");
        long fundedCount = matchRepository.countByStatus("FUNDED");

        long totalBeneficiaries = ngoRepository.findAll().stream()
                .mapToLong(ngo -> ngo.getAnnualBeneficiaries() != null ? ngo.getAnnualBeneficiaries() : 0)
                .sum();

        long aspirationalCount = ngoRepository.countByIsAspirationalDistrictTrue();

        PlatformStats stats = PlatformStats.builder()
                .ngoCount(ngoCount)
                .corporateCount(corporateCount)
                .matchCount(matchCount)
                .interestedCount(interestedCount)
                .fundedCount(fundedCount)
                .totalBeneficiaries(totalBeneficiaries)
                .aspirationalDistrictsServed(aspirationalCount)
                .build();

        return ResponseEntity.ok(stats);
    }
}
