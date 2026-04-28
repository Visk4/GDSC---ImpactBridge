package com.impactbridge.controller;

import com.impactbridge.dto.NgoRequest;
import com.impactbridge.dto.NgoResponse;
import com.impactbridge.service.NgoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ngos")
@RequiredArgsConstructor
public class NgoController {

    private final NgoService ngoService;

    @PostMapping
    public ResponseEntity<NgoResponse> onboardNgo(@Valid @RequestBody NgoRequest request) {
        NgoResponse response = ngoService.onboardNgo(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<NgoResponse>> getAllNgos() {
        return ResponseEntity.ok(ngoService.getAllNgos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgoResponse> getNgoById(@PathVariable UUID id) {
        return ngoService.getNgoById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<NgoResponse> publishNgo(@PathVariable UUID id) {
        return ResponseEntity.ok(ngoService.publishNgo(id));
    }
}
