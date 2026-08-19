package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Rewards;
import org.example.duwaz.repo.RewardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RewardsService {

    private final RewardRepository rewardRepository;

    public RewardsService(RewardRepository rewardRepository) {
        this.rewardRepository = rewardRepository;
    }

    public List<Rewards> getAllRewards() {
        return rewardRepository.findAll();
    }

    public Rewards getRewardById(Long id) {
        return rewardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reward not found with id: " + id));
    }

    public Rewards createReward(Rewards reward) {
        return rewardRepository.save(reward);
    }

    public Rewards updateReward(Long id, Rewards updatedReward) {
        Rewards existing = getRewardById(id);
        existing.setName(updatedReward.getName());
        existing.setDescription(updatedReward.getDescription());
        existing.setPoints(updatedReward.getPoints());
        return rewardRepository.save(existing);
    }

    public void deleteReward(Long id) {
        rewardRepository.deleteById(id);
    }
}
