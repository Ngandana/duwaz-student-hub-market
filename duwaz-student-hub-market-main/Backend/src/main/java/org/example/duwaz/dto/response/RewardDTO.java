package org.example.duwaz.dto.response;

/** For the (unused-by-the-frontend, admin-manageable) Rewards catalog entity — not
 *  to be confused with StudentRewardDTO, which is the real per-order points ledger. */
public record RewardDTO(Long id, String name, String description, Integer points) {}
