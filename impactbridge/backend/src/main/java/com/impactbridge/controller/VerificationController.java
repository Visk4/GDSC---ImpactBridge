package com.impactbridge.controller;

import com.impactbridge.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:5173", "https://*.vercel.app" })
public class VerificationController {

    private final VerificationService verificationService;

    // Verify NGO with registration details
    @PostMapping("/ngo/{ngoId}")
    public ResponseEntity<Map<String, Object>> verifyNgo(
            @PathVariable UUID ngoId,
            @RequestBody Map<String, String> body) {
        try {
            Map<String, Object> result = verificationService.verifyNgo(
                    ngoId,
                    body.get("registrationNumber"),
                    body.get("panNumber"),
                    body.get("ngoDarpanId"));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Verify Corporate with CIN and GSTIN
    @PostMapping("/corporate/{corporateId}")
    public ResponseEntity<Map<String, Object>> verifyCorporate(
            @PathVariable UUID corporateId,
            @RequestBody Map<String, String> body) {
        try {
            Map<String, Object> result = verificationService.verifyCorporate(
                    corporateId,
                    body.get("cinNumber"),
                    body.get("gstin"));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Quick format check for CIN (real-time, no DB)
    @GetMapping("/cin-check")
    public ResponseEntity<Map<String, Object>> checkCIN(
            @RequestParam String cin) {
        return ResponseEntity.ok(verificationService.quickCheckCIN(cin));
    }

    // Quick format check for NGO Darpan ID (real-time, no DB)
    @GetMapping("/darpan-check")
    public ResponseEntity<Map<String, Object>> checkDarpan(
            @RequestParam String darpanId) {
        return ResponseEntity.ok(verificationService.quickCheckDarpanId(darpanId));
    }
}