package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Rewards;
import org.example.duwaz.service.RewardsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rewards")
@CrossOrigin(origins = "*")
public class RewardController {

    private final RewardsService rewardsService;

    @Autowired
    public RewardController(RewardsService rewardsService) {
        this.rewardsService = rewardsService;
    }

    @GetMapping
    public ResponseEntity<List<Rewards>> getAllRewards() {
        return ResponseEntity.ok(rewardsService.getAllRewards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rewards> getRewardById(@PathVariable Long id) {
        return ResponseEntity.ok(rewardsService.getRewardById(id));
    }

    @PostMapping
    public ResponseEntity<Rewards> createReward(@RequestBody Rewards reward) {
        return ResponseEntity.status(201).body(rewardsService.createReward(reward));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rewards> updateReward(@PathVariable Long id, @RequestBody Rewards updatedReward) {
        return ResponseEntity.ok(rewardsService.updateReward(id, updatedReward));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReward(@PathVariable Long id) {
        rewardsService.deleteReward(id);
        return ResponseEntity.noContent().build();
    }
}
