package org.example.duwaz.service;

import org.example.duwaz.classesFolder.*;
import org.example.duwaz.classesFolder.Transaction.TransactionStatus;
import org.example.duwaz.repo.DriverEarningRepository;
import org.example.duwaz.repo.StudentRewardRepository;
import org.example.duwaz.repo.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final StudentRewardRepository rewardRepository;
    private final DriverEarningRepository earningRepository;

    public TransactionService(TransactionRepository transactionRepository,
                               StudentRewardRepository rewardRepository,
                               DriverEarningRepository earningRepository) {
        this.transactionRepository = transactionRepository;
        this.rewardRepository = rewardRepository;
        this.earningRepository = earningRepository;
    }

    /**
     * Called automatically when an order is marked DELIVERED.
     * 1. Creates a COMPLETED Transaction record for the order.
     * 2. Awards 5% loyalty points to the customer (rounded down, min 1).
     * Idempotent — skips if a transaction already exists for the order.
     */
    public void createDeliveryTransaction(Order order) {
        if (order == null || order.getStudent() == null) return;
        if (transactionRepository.findByOrder_Id(order.getId()).isPresent()) return;

        Student student = order.getStudent();
        BigDecimal amount = order.getTotalAmount();

        // ── 1. Transaction record ─────────────────────────────────────────────
        Transaction tx = new Transaction();
        tx.setStudent(student);
        tx.setOrder(order);
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            tx.setProduct(order.getItems().get(0).getProduct());
        }
        tx.setAmount(amount);
        tx.setStatus(TransactionStatus.COMPLETED);
        transactionRepository.save(tx);

        // ── 2. Customer loyalty points (5%) ───────────────────────────────────
        if (!rewardRepository.existsByOrderId(order.getId())) {
            int points = amount
                    .multiply(BigDecimal.valueOf(0.05))
                    .setScale(0, RoundingMode.FLOOR)
                    .intValue();
            if (points < 1) points = 1;
            rewardRepository.save(new StudentReward(student, order, points, amount));
        }
    }

    /**
     * Records the 10% commission earned by the driver for a delivered order.
     * Called separately so the driver reference can be passed in.
     * Idempotent — skips if earning already recorded for this order.
     */
    public void recordDriverEarning(Order order, DeliverDriver driver) {
        if (order == null || driver == null) return;
        if (earningRepository.existsByOrderId(order.getId())) return;

        BigDecimal orderTotal = order.getTotalAmount();
        BigDecimal earning = orderTotal
                .multiply(BigDecimal.valueOf(0.10))
                .setScale(2, RoundingMode.HALF_UP);

        earningRepository.save(new DriverEarning(driver, order, earning, orderTotal));
    }

    // ── Customer read methods ─────────────────────────────────────────────────

    public List<Transaction> getByStudentId(Long studentId) {
        if (studentId == null) return transactionRepository.findAll();
        return transactionRepository.findByStudent_Id(studentId);
    }

    public BigDecimal getTotalSpendByStudentId(Long studentId) {
        return transactionRepository.sumCompletedByStudentId(studentId);
    }

    public int getTotalPointsByStudentId(Long studentId) {
        return rewardRepository.sumPointsByStudentId(studentId);
    }

    public List<StudentReward> getRewardHistoryByStudentId(Long studentId) {
        return rewardRepository.findByStudentIdOrderByEarnedAtDesc(studentId);
    }

    // ── Driver read methods ───────────────────────────────────────────────────

    public List<DriverEarning> getEarningsByDriverId(Long driverId) {
        return earningRepository.findByDriverDeliveryDriverIdOrderByEarnedAtDesc(driverId);
    }

    public BigDecimal getTotalEarningsByDriverId(Long driverId) {
        return earningRepository.sumByDriverId(driverId);
    }
}
