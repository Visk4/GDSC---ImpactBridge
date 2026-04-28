package com.impactbridge.controller;

import com.impactbridge.dto.CorporateRequest;
import com.impactbridge.entity.Corporate;
import com.impactbridge.service.CorporateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/corporates")
@RequiredArgsConstructor
public class CorporateController {

    private final CorporateService corporateService;

    @PostMapping
    public ResponseEntity<Corporate> createCorporate(@Valid @RequestBody CorporateRequest request) {
        Corporate corporate = corporateService.createCorporate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(corporate);
    }

    @GetMapping
    public ResponseEntity<List<Corporate>> getAllCorporates() {
        return ResponseEntity.ok(corporateService.getAllCorporates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Corporate> getCorporateById(@PathVariable UUID id) {
        return corporateService.getCorporateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
