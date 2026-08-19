package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.Rewards;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RewardRepository extends JpaRepository<Rewards, Long> {
}
