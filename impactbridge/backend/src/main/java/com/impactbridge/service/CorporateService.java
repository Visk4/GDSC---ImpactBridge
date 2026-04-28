package com.impactbridge.service;

import com.impactbridge.dto.CorporateRequest;
import com.impactbridge.entity.Corporate;
import com.impactbridge.repository.CorporateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CorporateService {

    private final CorporateRepository corporateRepository;

    public Corporate createCorporate(CorporateRequest request) {
        if (corporateRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Corporate with this name already exists");
        }
        
        Corporate corporate = Corporate.builder()
                .name(request.getName())
                .sector(request.getSector())
                .csrBudget(request.getCsrBudget())
                .focusTheme(request.getFocusTheme())
                .preferredState(request.getPreferredState())
                .requiresFcra(request.getRequiresFcra() != null ? request.getRequiresFcra() : false)
                .contactEmail(request.getContactEmail())
                .build();

        return corporateRepository.save(corporate);
    }

    public List<Corporate> getAllCorporates() {
        return corporateRepository.findAll();
    }

    public Optional<Corporate> getCorporateById(UUID id) {
        return corporateRepository.findById(id);
    }
}
