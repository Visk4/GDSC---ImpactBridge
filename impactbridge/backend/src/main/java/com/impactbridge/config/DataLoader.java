package com.impactbridge.config;

import com.impactbridge.entity.Corporate;
import com.impactbridge.entity.HeatmapData;
import com.impactbridge.entity.Ngo;
import com.impactbridge.repository.CorporateRepository;
import com.impactbridge.repository.HeatmapDataRepository;
import com.impactbridge.repository.NgoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final NgoRepository ngoRepository;
    private final CorporateRepository corporateRepository;
    private final HeatmapDataRepository heatmapDataRepository;

    @Override
    public void run(String... args) {
        seedNgos();
        seedCorporates();
        seedHeatmapData();
    }

    private void seedNgos() {
        if (ngoRepository.count() > 0) {
            log.info("NGOs already seeded, skipping.");
            return;
        }
        log.info("Seeding 10 demo NGOs...");

        List<Ngo> ngos = List.of(
            buildNgo("Nandurbar Tribal Welfare Society", "SOCIETY", "Maharashtra", "Nandurbar", "LIVELIHOOD",
                "We train tribal women in bamboo craft and digital payments in Nandurbar district. 200 women per year. Running since 2019. Need ₹8 lakhs.",
                5, 200, true, buildProposal("Tribal Women Bamboo Craft & Digital Payments Program", "LIVELIHOOD", 200, 800000, "Promoting education and employment enhancing skills", "Clause (ii)", List.of("SDG 8","SDG 1"), 72)),
            buildNgo("Shiksha Setu Foundation", "TRUST", "Jharkhand", "Dumka", "EDUCATION",
                "We run bridge schools for out-of-school children in Dumka district. 450 children annually. 15 volunteer teachers. Need ₹12 lakhs.",
                7, 450, true, buildProposal("Bridge Schools for Out-of-School Children", "EDUCATION", 450, 1200000, "Promoting education and employment enhancing skills", "Clause (ii)", List.of("SDG 4","SDG 10"), 78)),
            buildNgo("Aarogya Rural Health Initiative", "SECTION8", "Odisha", "Malkangiri", "HEALTH",
                "Mobile health clinics serving 8 remote villages in Malkangiri. 1200 patients per year. 2 doctors, 4 nurses. Need ₹20 lakhs.",
                4, 1200, true, buildProposal("Mobile Health Clinics for Remote Villages", "HEALTH", 1200, 2000000, "Eradicating hunger, poverty and malnutrition", "Clause (i)", List.of("SDG 3","SDG 1"), 70)),
            buildNgo("Green Deccan Environment Trust", "TRUST", "Telangana", "Adilabad", "ENVIRONMENT",
                "Reforestation and water conservation across 500 acres in Adilabad. Benefiting 5 villages, 2000 farmers. Need ₹15 lakhs.",
                8, 2000, false, buildProposal("Deccan Reforestation & Water Conservation", "ENVIRONMENT", 2000, 1500000, "Ensuring environmental sustainability", "Clause (iv)", List.of("SDG 13","SDG 15"), 82)),
            buildNgo("Sakhi Women Empowerment Society", "SOCIETY", "Rajasthan", "Barmer", "WOMEN_EMPOWERMENT",
                "Legal aid and skill training for women in Barmer district. 300 women annually. Partnership with district court. Need ₹10 lakhs.",
                6, 300, true, buildProposal("Legal Aid & Skill Training for Women", "WOMEN_EMPOWERMENT", 300, 1000000, "Promoting gender equality and empowering women", "Clause (iii)", List.of("SDG 5","SDG 10"), 75)),
            buildNgo("Annapoorna Hunger Relief Trust", "TRUST", "Uttar Pradesh", "Bahraich", "HUNGER",
                "Community kitchens serving hot meals to 500 daily laborers in Bahraich. Operating 365 days. Need ₹6 lakhs.",
                3, 500, true, buildProposal("Community Kitchen for Daily Wage Laborers", "HUNGER", 500, 600000, "Eradicating hunger, poverty and malnutrition", "Clause (i)", List.of("SDG 2","SDG 1"), 65)),
            buildNgo("Drishti Disability Foundation", "SECTION8", "Gujarat", "Dahod", "DISABILITY",
                "Assistive devices and rehabilitation for persons with disabilities in Dahod. 150 beneficiaries per year. Need ₹18 lakhs.",
                5, 150, true, buildProposal("Assistive Devices & Rehabilitation Program", "DISABILITY", 150, 1800000, "Eradicating hunger, poverty and malnutrition", "Clause (i)", List.of("SDG 3","SDG 10"), 73)),
            buildNgo("Grameen Digital Literacy Society", "SOCIETY", "Bihar", "Sheohar", "EDUCATION",
                "Digital literacy centers in 10 villages of Sheohar district. 800 adults trained annually on smartphones and banking. Need ₹9 lakhs.",
                2, 800, true, buildProposal("Rural Digital Literacy Centers", "EDUCATION", 800, 900000, "Promoting education and employment enhancing skills", "Clause (ii)", List.of("SDG 4","SDG 8"), 60)),
            buildNgo("Vanvasi Rural Development Trust", "TRUST", "Chhattisgarh", "Bijapur", "RURAL_DEVELOPMENT",
                "Infrastructure development — roads, water tanks, solar lights for 12 tribal villages in Bijapur. 3000 beneficiaries. Need ₹25 lakhs.",
                10, 3000, true, buildProposal("Tribal Village Infrastructure Development", "RURAL_DEVELOPMENT", 3000, 2500000, "Rural development projects", "Clause (x)", List.of("SDG 11","SDG 9"), 85)),
            buildNgo("Mumbai Urban Health Collective", "SECTION8", "Maharashtra", "Mumbai", "HEALTH",
                "Primary healthcare for slum communities in Dharavi. 2500 patients monthly. 5 clinics. Need ₹30 lakhs.",
                12, 30000, false, buildProposal("Dharavi Primary Healthcare Network", "HEALTH", 30000, 3000000, "Slum area development", "Clause (xi)", List.of("SDG 3","SDG 11"), 90))
        );

        ngoRepository.saveAll(ngos);
        log.info("Seeded {} NGOs.", ngos.size());
    }

    private Ngo buildNgo(String name, String regType, String state, String district, String theme,
                         String desc, int years, int beneficiaries, boolean aspirational, Map<String, Object> proposal) {
        int credScore = proposal.containsKey("credibilityScore") ? ((Number)proposal.get("credibilityScore")).intValue() : 50;
        String schedCat = (String) proposal.getOrDefault("scheduleVIICategory", "");
        @SuppressWarnings("unchecked")
        List<String> sdg = (List<String>) proposal.getOrDefault("sdgTags", List.of());
        String sdgRaw = sdg.isEmpty() ? null : String.join(",", sdg);

        return Ngo.builder().name(name).registrationType(regType).state(state).district(district).theme(theme)
                .description(desc).yearsActive(years).annualBeneficiaries(beneficiaries)
                .isAspirationalDistrict(aspirational).generatedProposal(proposal)
                .credibilityScore(credScore).scheduleViiCategory(schedCat).sdgTagsRaw(sdgRaw).build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildProposal(String title, String theme, int beneficiaries, int budget,
                                               String schedCat, String schedClause, List<String> sdgs, int credScore) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("projectTitle", title);
        p.put("problemStatement", "Communities face critical challenges in " + theme.toLowerCase().replace("_"," ") + " access. This project targets the most underserved populations.");
        p.put("proposedSolution", "A comprehensive intervention delivering measurable outcomes through community engagement and evidence-based approaches.");
        p.put("targetBeneficiaries", beneficiaries);
        p.put("budgetRequired", budget);
        Map<String,Object> bb = new LinkedHashMap<>();
        bb.put("personnel", (int)(budget*0.40)); bb.put("operations", (int)(budget*0.30));
        bb.put("equipment", (int)(budget*0.15)); bb.put("monitoring", (int)(budget*0.15));
        p.put("budgetBreakdown", bb);
        p.put("expectedOutcomes", List.of("Direct impact on "+beneficiaries+" beneficiaries","Strengthened community capacity","Sustainable and replicable model"));
        p.put("sdgTags", sdgs);
        p.put("scheduleVIICategory", schedCat);
        p.put("scheduleVIIClause", schedClause);
        p.put("credibilityScore", credScore);
        p.put("credibilityFactors", List.of("Established operational track record","Demonstrated community impact","Registered organization with compliance"));
        p.put("implementationTimeline", "12 months");
        p.put("complianceNote", "Donation qualifies for 50% tax deduction under Section 80G. CSR expenditure counts towards mandatory 2% under Section 135.");
        return p;
    }

    private void seedCorporates() {
        if (corporateRepository.count() > 0) { log.info("Corporates already seeded, skipping."); return; }
        log.info("Seeding 3 demo corporates...");
        corporateRepository.saveAll(List.of(
            Corporate.builder().name("Tata Consultancy Services").sector("IT").csrBudget(5000000L).focusTheme("EDUCATION").preferredState("Maharashtra").build(),
            Corporate.builder().name("Mahindra & Mahindra").sector("Automotive").csrBudget(2500000L).focusTheme("LIVELIHOOD").preferredState("Maharashtra").build(),
            Corporate.builder().name("Sun Pharmaceuticals").sector("Pharma").csrBudget(3000000L).focusTheme("HEALTH").preferredState("Gujarat").build()
        ));
        log.info("Seeded 3 corporates.");
    }

    private void seedHeatmapData() {
        if (heatmapDataRepository.count() > 0) { log.info("Heatmap data already seeded, skipping."); return; }
        log.info("Seeding heatmap data for 25 districts...");
        List<HeatmapData> districts = List.of(
            hd("Nandurbar","Maharashtra",21.3700,73.5000,85,200000,2,82,true),
            hd("Dumka","Jharkhand",24.2700,87.2500,80,150000,1,78,true),
            hd("Malkangiri","Odisha",18.3500,81.8900,90,100000,1,88,true),
            hd("Barmer","Rajasthan",25.7500,71.3800,75,300000,2,70,true),
            hd("Bahraich","Uttar Pradesh",27.5700,81.5900,82,180000,1,80,true),
            hd("Dahod","Gujarat",22.8400,74.2500,78,250000,1,75,true),
            hd("Sheohar","Bihar",26.5200,85.3000,88,80000,1,86,true),
            hd("Bijapur","Chhattisgarh",18.8400,80.7700,92,120000,1,90,true),
            hd("Adilabad","Telangana",19.6700,78.5300,65,400000,2,55,false),
            hd("Mumbai","Maharashtra",19.0760,72.8777,20,50000000,45,10,false),
            hd("Namsai","Arunachal Pradesh",27.6900,95.8700,70,50000,0,72,true),
            hd("Kiphire","Nagaland",25.8800,94.9700,85,30000,0,87,true),
            hd("Hailakandi","Assam",24.6800,92.5600,72,120000,1,70,true),
            hd("Dhalai","Tripura",23.8400,91.9800,74,90000,0,76,true),
            hd("Kupwara","Jammu and Kashmir",34.5300,74.2600,68,200000,1,65,true),
            hd("Chamba","Himachal Pradesh",32.5500,76.1200,60,180000,1,55,true),
            hd("Dantewada","Chhattisgarh",18.9000,81.3500,95,60000,0,94,true),
            hd("Nuapada","Odisha",20.8200,82.5500,87,70000,0,86,true),
            hd("Kalahandi","Odisha",19.9100,83.1700,83,150000,1,80,true),
            hd("Ramanathapuram","Tamil Nadu",9.3600,78.8300,62,350000,3,50,true),
            hd("Chitrakoot","Uttar Pradesh",25.2000,80.9500,77,100000,1,75,true),
            hd("Fatehpur","Uttar Pradesh",25.9300,80.8100,70,220000,2,62,true),
            hd("Shrawasti","Uttar Pradesh",27.5000,81.7300,84,60000,0,85,true),
            hd("Sonbhadra","Uttar Pradesh",24.6900,83.0600,80,160000,1,78,true),
            hd("Pune","Maharashtra",18.5204,73.8567,25,30000000,35,12,false)
        );
        heatmapDataRepository.saveAll(districts);
        log.info("Seeded {} heatmap districts.", districts.size());
    }

    private HeatmapData hd(String district, String state, double lat, double lng, int need, long funding, int ngoCount, int opp, boolean asp) {
        return HeatmapData.builder().districtName(district).state(state)
                .latitude(BigDecimal.valueOf(lat)).longitude(BigDecimal.valueOf(lng))
                .needScore(need).csrFundingReceived(funding).ngoCount(ngoCount).opportunityScore(opp).isAspirational(asp).build();
    }
}
