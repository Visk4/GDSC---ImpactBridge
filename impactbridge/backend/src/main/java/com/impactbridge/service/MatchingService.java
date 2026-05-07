package com.impactbridge.service;

import com.impactbridge.dto.MatchResponse;
import com.impactbridge.entity.Corporate;
import com.impactbridge.entity.Match;
import com.impactbridge.entity.Ngo;
import com.impactbridge.repository.CorporateRepository;
import com.impactbridge.repository.MatchRepository;
import com.impactbridge.repository.NgoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

    private final NgoRepository ngoRepository;
    private final CorporateRepository corporateRepository;
    private final MatchRepository matchRepository;

    // Neighboring states mapping for geographic scoring
    private static final Map<String, Set<String>> NEIGHBORING_STATES = Map.ofEntries(
            Map.entry("Maharashtra", Set.of("Gujarat", "Madhya Pradesh", "Chhattisgarh", "Telangana", "Karnataka", "Goa")),
            Map.entry("Gujarat", Set.of("Maharashtra", "Madhya Pradesh", "Rajasthan")),
            Map.entry("Rajasthan", Set.of("Gujarat", "Madhya Pradesh", "Uttar Pradesh", "Haryana", "Punjab")),
            Map.entry("Uttar Pradesh", Set.of("Rajasthan", "Madhya Pradesh", "Chhattisgarh", "Bihar", "Jharkhand", "Uttarakhand", "Haryana", "Delhi")),
            Map.entry("Bihar", Set.of("Uttar Pradesh", "Jharkhand", "West Bengal")),
            Map.entry("Jharkhand", Set.of("Bihar", "West Bengal", "Odisha", "Chhattisgarh", "Uttar Pradesh")),
            Map.entry("Odisha", Set.of("Jharkhand", "Chhattisgarh", "Andhra Pradesh", "West Bengal", "Telangana")),
            Map.entry("Chhattisgarh", Set.of("Madhya Pradesh", "Maharashtra", "Telangana", "Odisha", "Jharkhand", "Uttar Pradesh")),
            Map.entry("Telangana", Set.of("Maharashtra", "Chhattisgarh", "Andhra Pradesh", "Karnataka")),
            Map.entry("Karnataka", Set.of("Maharashtra", "Goa", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana")),
            Map.entry("Tamil Nadu", Set.of("Karnataka", "Kerala", "Andhra Pradesh")),
            Map.entry("Kerala", Set.of("Karnataka", "Tamil Nadu")),
            Map.entry("Andhra Pradesh", Set.of("Telangana", "Karnataka", "Tamil Nadu", "Odisha", "Chhattisgarh")),
            Map.entry("West Bengal", Set.of("Bihar", "Jharkhand", "Odisha", "Sikkim")),
            Map.entry("Madhya Pradesh", Set.of("Rajasthan", "Uttar Pradesh", "Chhattisgarh", "Maharashtra", "Gujarat")),
            Map.entry("Punjab", Set.of("Haryana", "Rajasthan", "Himachal Pradesh", "Jammu and Kashmir")),
            Map.entry("Haryana", Set.of("Punjab", "Rajasthan", "Uttar Pradesh", "Delhi", "Himachal Pradesh")),
            Map.entry("Delhi", Set.of("Haryana", "Uttar Pradesh"))
    );

    // Related themes for thematic scoring
    private static final Map<String, Set<String>> RELATED_THEMES = Map.ofEntries(
            Map.entry("EDUCATION", Set.of("LIVELIHOOD", "WOMEN_EMPOWERMENT", "DISABILITY")),
            Map.entry("HEALTH", Set.of("HUNGER", "DISABILITY", "WOMEN_EMPOWERMENT")),
            Map.entry("ENVIRONMENT", Set.of("RURAL_DEVELOPMENT", "LIVELIHOOD")),
            Map.entry("LIVELIHOOD", Set.of("EDUCATION", "RURAL_DEVELOPMENT", "WOMEN_EMPOWERMENT")),
            Map.entry("WOMEN_EMPOWERMENT", Set.of("EDUCATION", "HEALTH", "LIVELIHOOD")),
            Map.entry("RURAL_DEVELOPMENT", Set.of("LIVELIHOOD", "ENVIRONMENT", "EDUCATION")),
            Map.entry("DISABILITY", Set.of("HEALTH", "EDUCATION")),
            Map.entry("HUNGER", Set.of("HEALTH", "RURAL_DEVELOPMENT"))
    );

    /**
     * Generate matches for a specific corporate against all NGOs.
     * Returns a ranked list sorted by overall_score DESC.
     */
    public List<MatchResponse> generateMatchesForCorporate(UUID corporateId) {
        Corporate corporate = corporateRepository.findById(corporateId)
                .orElseThrow(() -> new NoSuchElementException("Corporate not found: " + corporateId));

        List<Ngo> ngos = ngoRepository.findAll();
        List<Match> matches = new ArrayList<>();

        for (Ngo ngo : ngos) {
            // Skip if match already exists
            if (matchRepository.existsByCorporateIdAndNgoId(corporateId, ngo.getId())) {
                continue;
            }

            int geographicScore = scoreGeographic(ngo, corporate);
            int thematicScore = scoreThematic(ngo, corporate);
            int budgetScore = scoreBudget(ngo, corporate);
            int complianceScore = scoreCompliance(ngo);
            int impactDensityScore = scoreImpactDensity(ngo);

            int overallScore = Math.min(100, geographicScore + thematicScore + budgetScore + complianceScore + impactDensityScore);

            String complianceNote = generateComplianceNote(ngo, complianceScore);

            Match match = Match.builder()
                    .corporateId(corporateId)
                    .ngoId(ngo.getId())
                    .overallScore(overallScore)
                    .geographicScore(geographicScore)
                    .thematicScore(thematicScore)
                    .budgetScore(budgetScore)
                    .complianceScore(complianceScore)
                    .impactDensityScore(impactDensityScore)
                    .complianceNote(complianceNote)
                    .status("PENDING")
                    .build();

            matches.add(match);
        }

        List<Match> saved = matchRepository.saveAll(matches);

        // Also include previously existing matches
        List<Match> allMatches = matchRepository.findByCorporateIdOrderByOverallScoreDesc(corporateId);

        return allMatches.stream()
                .map(m -> toMatchResponse(m, corporate))
                .collect(Collectors.toList());
    }

    /**
     * Get existing matches for a corporate.
     */
    public List<MatchResponse> getMatchesForCorporate(UUID corporateId) {
        Corporate corporate = corporateRepository.findById(corporateId)
                .orElseThrow(() -> new NoSuchElementException("Corporate not found: " + corporateId));

        List<Match> matches = matchRepository.findByCorporateIdOrderByOverallScoreDesc(corporateId);

        if (matches.isEmpty()) {
            // Auto-generate matches if none exist
            return generateMatchesForCorporate(corporateId);
        }

        return matches.stream()
                .map(m -> toMatchResponse(m, corporate))
                .collect(Collectors.toList());
    }

    // ─── SCORING ALGORITHMS (total = 100 points) ────────────────────────────

    /**
     * GEOGRAPHIC SCORE (20 points):
     * - Same state: 20 points
     * - Neighboring state: 10 points
     * - Different state but aspirational district: 15 points
     * - Different region: 5 points
     */
    private int scoreGeographic(Ngo ngo, Corporate corporate) {
        if (ngo.getState() == null || corporate.getPreferredState() == null) {
            return 5;
        }

        String ngoState = ngo.getState().trim();
        String corpState = corporate.getPreferredState().trim();

        if (ngoState.equalsIgnoreCase(corpState)) {
            return 20;
        }

        Set<String> neighbors = NEIGHBORING_STATES.getOrDefault(corpState, Collections.emptySet());
        if (neighbors.stream().anyMatch(n -> n.equalsIgnoreCase(ngoState))) {
            return 10;
        }

        if (Boolean.TRUE.equals(ngo.getIsAspirationalDistrict())) {
            return 15;
        }

        return 5;
    }

    /**
     * THEMATIC SCORE (30 points):
     * - Exact theme match: 30 points
     * - Related theme match: 15 points
     * - No match: 0 points
     */
    private int scoreThematic(Ngo ngo, Corporate corporate) {
        if (ngo.getTheme() == null || corporate.getFocusTheme() == null) {
            return 0;
        }

        String ngoTheme = ngo.getTheme().trim().toUpperCase();
        String corpTheme = corporate.getFocusTheme().trim().toUpperCase();

        if (ngoTheme.equals(corpTheme)) {
            return 30;
        }

        Set<String> related = RELATED_THEMES.getOrDefault(corpTheme, Collections.emptySet());
        if (related.contains(ngoTheme)) {
            return 15;
        }

        return 0;
    }

    /**
     * BUDGET SCORE (20 points):
     * - NGO budget ask <= corporate budget: 20 points
     * - NGO ask is 110-125% of corporate budget: 10 points
     * - NGO ask is 125-150% of corporate budget: 5 points
     * - NGO ask > 150% of corporate budget: 0 points
     */
    private int scoreBudget(Ngo ngo, Corporate corporate) {
        Long budgetRequired = extractBudgetFromProposal(ngo);
        Long csrBudget = corporate.getCsrBudget();

        if (budgetRequired == null || csrBudget == null || csrBudget <= 0) {
            return 10;
        }

        double ratio = (double) budgetRequired / csrBudget;

        if (ratio <= 1.0) {
            return 20;
        } else if (ratio <= 1.25) {
            return 10;
        } else if (ratio <= 1.50) {
            return 5;
        } else {
            return 0;
        }
    }

    /**
     * COMPLIANCE SCORE (15 points):
     * - TRUST with FCRA: 15 points
     * - Has 80G + 12A (SECTION8): 15 points
     * - SECTION8 company: 12 points
     * - Has only 12A: 8 points
     * - Basic TRUST/SOCIETY: 5 points
     */
    private int scoreCompliance(Ngo ngo) {
        String regType = ngo.getRegistrationType();
        if (regType == null) return 5;

        regType = regType.toUpperCase().trim();

        return switch (regType) {
            case "FCRA" -> 15;
            case "SECTION8", "SECTION 8" -> 12;
            case "TRUST" -> {
                // Check if trust has any indicators of FCRA compliance
                String desc = ngo.getDescription() != null ? ngo.getDescription().toLowerCase() : "";
                if (desc.contains("fcra") || desc.contains("foreign contribution")) {
                    yield 15;
                }
                yield 5;
            }
            case "SOCIETY" -> 5;
            default -> 5;
        };
    }

    /**
     * IMPACT DENSITY SCORE (15 points):
     * - Calculate: beneficiaries / (budgetRequired / 100000)
     * - Score > 50 beneficiaries per lakh: 15 points
     * - Score 25-50: 10 points
     * - Score 10-25: 5 points
     * - Score < 10: 2 points
     */
    private int scoreImpactDensity(Ngo ngo) {
        Integer beneficiaries = ngo.getAnnualBeneficiaries();
        Long budgetRequired = extractBudgetFromProposal(ngo);

        if (beneficiaries == null || beneficiaries <= 0 || budgetRequired == null || budgetRequired <= 0) {
            return 2;
        }

        double budgetInLakhs = budgetRequired / 100000.0;
        if (budgetInLakhs <= 0) return 2;

        double impactDensity = beneficiaries / budgetInLakhs;

        if (impactDensity > 50) return 15;
        if (impactDensity >= 25) return 10;
        if (impactDensity >= 10) return 5;
        return 2;
    }

    // ─── HELPER METHODS ─────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Long extractBudgetFromProposal(Ngo ngo) {
        if (ngo.getGeneratedProposal() != null && ngo.getGeneratedProposal().containsKey("budgetRequired")) {
            Object val = ngo.getGeneratedProposal().get("budgetRequired");
            if (val instanceof Number) {
                return ((Number) val).longValue();
            }
        }
        // Fallback: estimate from beneficiaries
        if (ngo.getAnnualBeneficiaries() != null) {
            return (long) (ngo.getAnnualBeneficiaries() * 2000); // rough ₹2000 per beneficiary
        }
        return null;
    }

    private String generateComplianceNote(Ngo ngo, int complianceScore) {
        String regType = ngo.getRegistrationType() != null ? ngo.getRegistrationType() : "Unknown";
        if (complianceScore >= 12) {
            return String.format("%s registered as %s — eligible for 80G tax benefits. CSR expenditure qualifies under Section 135.", ngo.getName(), regType);
        } else {
            return String.format("%s registered as %s — basic compliance. Recommend verifying 80G/12A registration before disbursement.", ngo.getName(), regType);
        }
    }

    private MatchResponse toMatchResponse(Match match, Corporate corporate) {
        Ngo ngo = ngoRepository.findById(match.getNgoId()).orElse(null);
        if (ngo == null) return null;

        Long budgetRequired = extractBudgetFromProposal(ngo);

        return MatchResponse.builder()
                .id(match.getId())
                .corporateId(match.getCorporateId())
                .ngoId(match.getNgoId())
                .ngoName(ngo.getName())
                .ngoState(ngo.getState())
                .ngoDistrict(ngo.getDistrict())
                .ngoTheme(ngo.getTheme())
                .ngoRegistrationType(ngo.getRegistrationType())
                .ngoBeneficiaries(ngo.getAnnualBeneficiaries())
                .ngoIsAspirational(ngo.getIsAspirationalDistrict())
                .ngoVerificationStatus(ngo.getVerificationStatus())
                .ngoProposal(ngo.getGeneratedProposal())
                .overallScore(match.getOverallScore())
                .geographicScore(match.getGeographicScore())
                .thematicScore(match.getThematicScore())
                .budgetScore(match.getBudgetScore())
                .complianceScore(match.getComplianceScore())
                .impactDensityScore(match.getImpactDensityScore())
                .complianceNote(match.getComplianceNote())
                .outcomeNotes(match.getOutcomeNotes())
                .status(match.getStatus())
                .scheduleViiCategory(ngo.getScheduleViiCategory())
                .budgetRequired(budgetRequired)
                .sdgTags(ngo.getSdgTags())
                .build();
    }
}
