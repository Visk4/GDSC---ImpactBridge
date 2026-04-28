package com.impactbridge.repository;

import com.impactbridge.entity.Ngo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NgoRepository extends JpaRepository<Ngo, UUID> {

    List<Ngo> findByState(String state);

    List<Ngo> findByTheme(String theme);

    List<Ngo> findByStateAndTheme(String state, String theme);

    boolean existsByNameIgnoreCase(String name);
    boolean existsByPanNumberIgnoreCase(String panNumber);
    boolean existsByNgoDarpanIdIgnoreCase(String ngoDarpanId);

    long countByIsAspirationalDistrictTrue();
}
