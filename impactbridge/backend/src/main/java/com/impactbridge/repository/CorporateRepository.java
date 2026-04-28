package com.impactbridge.repository;

import com.impactbridge.entity.Corporate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CorporateRepository extends JpaRepository<Corporate, UUID> {

    List<Corporate> findByFocusTheme(String focusTheme);

    List<Corporate> findByPreferredState(String preferredState);

    boolean existsByNameIgnoreCase(String name);
    boolean existsByCinNumberIgnoreCase(String cinNumber);
    boolean existsByGstinIgnoreCase(String gstin);
}
