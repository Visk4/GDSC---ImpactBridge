package com.impactbridge.service;

import com.impactbridge.dto.NgoRequest;
import com.impactbridge.dto.NgoResponse;
import com.impactbridge.entity.Ngo;
import com.impactbridge.repository.NgoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NgoService {

    private final NgoRepository ngoRepository;

    @Value("${ai.service.url:http://localhost:3001}")
    private String aiServiceUrl;

    /**
     * Onboard a new NGO: save to DB, call AI service for proposal generation,
     * update NGO with generated proposal data.
     */
    @SuppressWarnings("unchecked")
    public NgoResponse onboardNgo(NgoRequest request) {
        if (ngoRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("NGO with this name already exists");
        }
        
        // Build NGO entity
        Ngo ngo = Ngo.builder()
                .name(request.getName())
                .registrationType(request.getRegistrationType())
                .state(request.getState())
                .district(request.getDistrict())
                .theme(request.getTheme())
                .description(request.getDescription())
                .yearsActive(request.getYearsActive())
                .annualBeneficiaries(request.getAnnualBeneficiaries())
                .website(request.getWebsite())
                .contactEmail(request.getContactEmail())
                .isAspirationalDistrict(isAspirationalDistrict(request.getDistrict()))
                .build();

        // Save initial NGO record
        ngo = ngoRepository.save(ngo);

        // Call AI service for proposal generation
        try {
            Map<String, Object> proposal = callAiServiceForProposal(request);

            if (proposal != null) {
                ngo.setGeneratedProposal(proposal);

                // Extract key fields from proposal
                if (proposal.containsKey("credibilityScore")) {
                    ngo.setCredibilityScore(((Number) proposal.get("credibilityScore")).intValue());
                }
                if (proposal.containsKey("scheduleVIICategory")) {
                    ngo.setScheduleViiCategory((String) proposal.get("scheduleVIICategory"));
                }
                if (proposal.containsKey("sdgTags") && proposal.get("sdgTags") instanceof List) {
                    ngo.setSdgTags((List<String>) proposal.get("sdgTags"));
                }
            }
        } catch (Exception e) {
            log.error("AI service call failed for NGO {}: {}. Using fallback proposal.", ngo.getName(), e.getMessage());
            ngo.setGeneratedProposal(generateFallbackProposal(request));
            ngo.setCredibilityScore(calculateFallbackCredibility(request));
            ngo.setScheduleViiCategory(inferScheduleVIICategory(request.getTheme()));
            ngo.setSdgTags(inferSdgTags(request.getTheme()));
        }

        // Save updated NGO with proposal
        ngo = ngoRepository.save(ngo);

        return toResponse(ngo);
    }

    public List<NgoResponse> getAllNgos() {
        return ngoRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Optional<NgoResponse> getNgoById(UUID id) {
        return ngoRepository.findById(id).map(this::toResponse);
    }

    // ─── AI Service Integration ──────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> callAiServiceForProposal(NgoRequest request) {
        WebClient client = WebClient.builder()
                .baseUrl(aiServiceUrl)
                .build();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("name", request.getName());
        requestBody.put("registrationType", request.getRegistrationType());
        requestBody.put("state", request.getState());
        requestBody.put("theme", request.getTheme());
        requestBody.put("description", request.getDescription());
        requestBody.put("yearsActive", request.getYearsActive());
        requestBody.put("annualBeneficiaries", request.getAnnualBeneficiaries());

        try {
            Map<String, Object> response = client.post()
                    .uri("/generate-proposal")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("proposal")) {
                return (Map<String, Object>) response.get("proposal");
            }
            return response;
        } catch (Exception e) {
            log.warn("AI service unavailable: {}", e.getMessage());
            throw e;
        }
    }

    // ─── Fallback Proposal Generation ────────────────────────────────────────

    private Map<String, Object> generateFallbackProposal(NgoRequest req) {
        Map<String, Object> proposal = new LinkedHashMap<>();
        proposal.put("projectTitle", "Empowerment through " + capitalize(req.getTheme()) + " — " + req.getName());
        proposal.put("problemStatement",
                String.format("Communities in %s face significant challenges in %s. " +
                        "%s addresses this critical gap through grassroots intervention serving %d beneficiaries annually.",
                        req.getState(), req.getTheme().toLowerCase().replace("_", " "),
                        req.getName(), req.getAnnualBeneficiaries()));
        proposal.put("proposedSolution",
                String.format("A comprehensive %s program leveraging %d years of operational experience " +
                        "to deliver measurable outcomes in %s, %s.",
                        req.getTheme().toLowerCase().replace("_", " "),
                        req.getYearsActive(), req.getDistrict() != null ? req.getDistrict() : "the region", req.getState()));

        int budgetEstimate = req.getAnnualBeneficiaries() * 2000;
        proposal.put("targetBeneficiaries", req.getAnnualBeneficiaries());
        proposal.put("budgetRequired", budgetEstimate);

        Map<String, Object> budgetBreakdown = new LinkedHashMap<>();
        budgetBreakdown.put("personnel", (int) (budgetEstimate * 0.40));
        budgetBreakdown.put("operations", (int) (budgetEstimate * 0.30));
        budgetBreakdown.put("equipment", (int) (budgetEstimate * 0.15));
        budgetBreakdown.put("monitoring", (int) (budgetEstimate * 0.15));
        proposal.put("budgetBreakdown", budgetBreakdown);

        proposal.put("expectedOutcomes", List.of(
                "Direct impact on " + req.getAnnualBeneficiaries() + " beneficiaries",
                "Strengthened community capacity in " + req.getTheme().toLowerCase().replace("_", " "),
                "Sustainable model for replication in neighboring districts"
        ));

        proposal.put("sdgTags", inferSdgTags(req.getTheme()));
        proposal.put("scheduleVIICategory", inferScheduleVIICategory(req.getTheme()));
        proposal.put("scheduleVIIClause", inferScheduleVIIClause(req.getTheme()));
        proposal.put("credibilityScore", calculateFallbackCredibility(req));
        proposal.put("credibilityFactors", List.of(
                req.getYearsActive() + " years of operational history",
                req.getAnnualBeneficiaries() + " annual beneficiaries",
                "Registered as " + req.getRegistrationType()
        ));
        proposal.put("implementationTimeline", "12 months");
        proposal.put("complianceNote",
                "Donation qualifies for 50% tax deduction under Section 80G of the Income Tax Act. " +
                "CSR expenditure counts towards mandatory 2% under Section 135.");

        return proposal;
    }

    private int calculateFallbackCredibility(NgoRequest req) {
        int score = 30; // base
        if (req.getYearsActive() != null) {
            score += Math.min(req.getYearsActive() * 5, 25);
        }
        if (req.getAnnualBeneficiaries() != null) {
            if (req.getAnnualBeneficiaries() > 1000) score += 20;
            else if (req.getAnnualBeneficiaries() > 500) score += 15;
            else if (req.getAnnualBeneficiaries() > 100) score += 10;
        }
        String regType = req.getRegistrationType() != null ? req.getRegistrationType().toUpperCase() : "";
        if (regType.contains("SECTION") || regType.contains("FCRA")) score += 15;
        else if (regType.equals("TRUST")) score += 10;
        else score += 5;
        return Math.min(score, 100);
    }

    private String inferScheduleVIICategory(String theme) {
        if (theme == null) return "Rural development projects";
        return switch (theme.toUpperCase()) {
            case "EDUCATION" -> "Promoting education and employment enhancing skills";
            case "HEALTH" -> "Eradicating hunger, poverty and malnutrition";
            case "ENVIRONMENT" -> "Ensuring environmental sustainability";
            case "LIVELIHOOD" -> "Promoting education and employment enhancing skills";
            case "WOMEN_EMPOWERMENT" -> "Promoting gender equality and empowering women";
            case "RURAL_DEVELOPMENT" -> "Rural development projects";
            case "DISABILITY" -> "Eradicating hunger, poverty and malnutrition";
            case "HUNGER" -> "Eradicating hunger, poverty and malnutrition";
            default -> "Rural development projects";
        };
    }

    private String inferScheduleVIIClause(String theme) {
        if (theme == null) return "Clause (x)";
        return switch (theme.toUpperCase()) {
            case "EDUCATION", "LIVELIHOOD" -> "Clause (ii)";
            case "HEALTH", "DISABILITY", "HUNGER" -> "Clause (i)";
            case "ENVIRONMENT" -> "Clause (iv)";
            case "WOMEN_EMPOWERMENT" -> "Clause (iii)";
            case "RURAL_DEVELOPMENT" -> "Clause (x)";
            default -> "Clause (x)";
        };
    }

    private List<String> inferSdgTags(String theme) {
        if (theme == null) return List.of("SDG 1");
        return switch (theme.toUpperCase()) {
            case "EDUCATION" -> List.of("SDG 4", "SDG 8");
            case "HEALTH" -> List.of("SDG 3", "SDG 1");
            case "ENVIRONMENT" -> List.of("SDG 13", "SDG 15");
            case "LIVELIHOOD" -> List.of("SDG 8", "SDG 1");
            case "WOMEN_EMPOWERMENT" -> List.of("SDG 5", "SDG 10");
            case "RURAL_DEVELOPMENT" -> List.of("SDG 11", "SDG 9");
            case "DISABILITY" -> List.of("SDG 3", "SDG 10");
            case "HUNGER" -> List.of("SDG 2", "SDG 1");
            default -> List.of("SDG 1");
        };
    }

    private boolean isAspirationalDistrict(String district) {
        if (district == null) return false;
        Set<String> aspirational = Set.of(
                "Nandurbar", "Dumka", "Malkangiri", "Barmer", "Bahraich",
                "Dahod", "Sheohar", "Bijapur", "Namsai", "Kiphire",
                "Hailakandi", "Baksa", "Dhalai", "Kupwara", "Chamba",
                "Gajapati", "Dantewada", "Korba", "Nuapada", "Kalahandi",
                "Ramanathapuram", "Virudhunagar", "Chitrakoot", "Fatehpur",
                "Shrawasti", "Balrampur", "Chandauli", "Sonbhadra"
        );
        return aspirational.stream().anyMatch(a -> a.equalsIgnoreCase(district.trim()));
    }

    private String capitalize(String s) {
        if (s == null) return "";
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase().replace("_", " ");
    }

    public NgoResponse publishNgo(UUID id) {
        Ngo ngo = ngoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NGO not found"));
        ngo.setIsPublished(true);
        return toResponse(ngoRepository.save(ngo));
    }

    private NgoResponse toResponse(Ngo ngo) {
        return NgoResponse.builder()
                .id(ngo.getId())
                .name(ngo.getName())
                .registrationType(ngo.getRegistrationType())
                .state(ngo.getState())
                .district(ngo.getDistrict())
                .theme(ngo.getTheme())
                .description(ngo.getDescription())
                .yearsActive(ngo.getYearsActive())
                .annualBeneficiaries(ngo.getAnnualBeneficiaries())
                .website(ngo.getWebsite())
                .contactEmail(ngo.getContactEmail())
                .generatedProposal(ngo.getGeneratedProposal())
                .credibilityScore(ngo.getCredibilityScore())
                .scheduleViiCategory(ngo.getScheduleViiCategory())
                .sdgTags(ngo.getSdgTags())
                .isAspirationalDistrict(ngo.getIsAspirationalDistrict())
                .isPublished(ngo.getIsPublished())
                .build();
    }
}
