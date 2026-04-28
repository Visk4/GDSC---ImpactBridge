package com.impactbridge.controller;

import com.impactbridge.dto.ExpressInterestRequest;
import com.impactbridge.dto.MatchResponse;
import com.impactbridge.entity.Match;
import com.impactbridge.repository.MatchRepository;
import com.impactbridge.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchingService matchingService;
    private final MatchRepository matchRepository;

    @GetMapping("/{corporateId}")
    public ResponseEntity<List<MatchResponse>> getMatchesForCorporate(@PathVariable UUID corporateId) {
        List<MatchResponse> matches = matchingService.getMatchesForCorporate(corporateId);
        return ResponseEntity.ok(matches);
    }

    @PostMapping("/generate/{corporateId}")
    public ResponseEntity<List<MatchResponse>> generateMatches(@PathVariable UUID corporateId) {
        List<MatchResponse> matches = matchingService.generateMatchesForCorporate(corporateId);
        return ResponseEntity.ok(matches);
    }

    @PostMapping("/express-interest")
    public ResponseEntity<Map<String, Object>> expressInterest(@RequestBody ExpressInterestRequest request) {
        UUID matchId = UUID.fromString(request.getMatchId());
        Match match = matchRepository.findById(matchId)
                .orElse(null);

        if (match == null) {
            return ResponseEntity.notFound().build();
        }

        match.setStatus("INTERESTED");
        matchRepository.save(match);

        // MOCK EMAIL NOTIFICATION (Gap 10)
        System.out.println("==================================================");
        System.out.println("📧 EMAIL NOTIFICATION DISPATCHED");
        System.out.println("To: NGO Admin");
        System.out.println("Subject: A Corporate is interested in your proposal!");
        System.out.println("Body: Good news! A corporate partner has expressed interest in funding your project. Log in to the platform to proceed with the compliance handshake.");
        System.out.println("==================================================");

        return ResponseEntity.ok(Map.of(
                "message", "Interest expressed successfully",
                "matchId", match.getId(),
                "status", "INTERESTED"
        ));
    }

    @PostMapping("/{matchId}/fund")
    public ResponseEntity<Map<String, Object>> markAsFunded(@PathVariable UUID matchId, @RequestBody Map<String, String> payload) {
        Match match = matchRepository.findById(matchId).orElse(null);
        if (match == null) return ResponseEntity.notFound().build();

        match.setStatus("FUNDED");
        if (payload.containsKey("outcomeNotes")) {
            match.setOutcomeNotes(payload.get("outcomeNotes"));
        }
        matchRepository.save(match);

        return ResponseEntity.ok(Map.of("message", "Project marked as funded", "status", "FUNDED"));
    }
}
