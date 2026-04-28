package com.impactbridge.repository;

import com.impactbridge.entity.HeatmapData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HeatmapDataRepository extends JpaRepository<HeatmapData, UUID> {

    List<HeatmapData> findByIsAspirationalTrue();

    List<HeatmapData> findByState(String state);

    boolean existsByDistrictNameAndState(String districtName, String state);
}
