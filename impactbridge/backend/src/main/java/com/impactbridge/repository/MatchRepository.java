package com.impactbridge.repository;

import com.impactbridge.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {

    List<Match> findByCorporateIdOrderByOverallScoreDesc(UUID corporateId);

    List<Match> findByNgoId(UUID ngoId);

    boolean existsByCorporateIdAndNgoId(UUID corporateId, UUID ngoId);

    long countByStatus(String status);
}
