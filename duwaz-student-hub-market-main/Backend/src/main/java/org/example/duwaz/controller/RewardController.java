package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Rewards;
import org.example.duwaz.dto.response.DtoMapper;
import org.example.duwaz.dto.response.RewardDTO;
import org.example.duwaz.service.RewardsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
public class RewardController {

    private final RewardsService rewardsService;

    @Autowired
    public RewardController(RewardsService rewardsService) {
        this.rewardsService = rewardsService;
    }

    @GetMapping
    public ResponseEntity<List<RewardDTO>> getAllRewards() {
        return ResponseEntity.ok(DtoMapper.rewardList(rewardsService.getAllRewards()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RewardDTO> getRewardById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toDto(rewardsService.getRewardById(id)));
    }

    @PostMapping
    public ResponseEntity<RewardDTO> createReward(@RequestBody Rewards reward) {
        return ResponseEntity.status(201).body(DtoMapper.toDto(rewardsService.createReward(reward)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RewardDTO> updateReward(@PathVariable Long id, @RequestBody Rewards updatedReward) {
        return ResponseEntity.ok(DtoMapper.toDto(rewardsService.updateReward(id, updatedReward)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReward(@PathVariable Long id) {
        rewardsService.deleteReward(id);
        return ResponseEntity.noContent().build();
    }
}
