package org.example.duwaz.service;

import org.example.duwaz.classesFolder.*;
import org.example.duwaz.classesFolder.Transaction.TransactionStatus;
import org.example.duwaz.repo.DriverEarningRepository;
import org.example.duwaz.repo.OrderRepository;
import org.example.duwaz.repo.RevenueSplitRepository;
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

    // ── Split rates ───────────────────────────────────────────────────────────
    private static final BigDecimal SHOP_RATE   = BigDecimal.valueOf(0.85); // 85% to shop owner
    private static final BigDecimal DUWAZ_RATE  = BigDecimal.valueOf(0.05); // 5%  to Duwaz
    private static final BigDecimal DRIVER_RATE = BigDecimal.valueOf(0.10); // 10% to driver

    // ── Loyalty points redemption ────────────────────────────────────────────
    public static final int POINTS_PER_REDEMPTION_BLOCK = 100;
    public static final BigDecimal REDEMPTION_BLOCK_VALUE = BigDecimal.valueOf(10); // 100 pts = R10

    private final TransactionRepository transactionRepository;
    private final StudentRewardRepository rewardRepository;
    private final DriverEarningRepository earningRepository;
    private final RevenueSplitRepository splitRepository;
    private final OrderRepository orderRepository;

    public TransactionService(TransactionRepository transactionRepository,
                               StudentRewardRepository rewardRepository,
                               DriverEarningRepository earningRepository,
                               RevenueSplitRepository splitRepository,
                               OrderRepository orderRepository) {
        this.transactionRepository = transactionRepository;
        this.rewardRepository      = rewardRepository;
        this.earningRepository     = earningRepository;
        this.splitRepository       = splitRepository;
        this.orderRepository       = orderRepository;
    }

    /**
     * Points a student can still redeem: total earned (5% of product subtotal on
     * every delivered order) minus total already spent on past orders. Spent points
     * are never given back, even if the order that spent them is later cancelled —
     * same as earned points aren't clawed back on cancellation either.
     */
    public int getAvailablePoints(Long studentId) {
        int earned = rewardRepository.sumPointsByStudentId(studentId);
        int redeemed = orderRepository.sumPointsRedeemedByStudentId(studentId);
        return Math.max(0, earned - redeemed);
    }

    // ── Main entry point called on DELIVERED ─────────────────────────────────

    /**
     * Called when an order is marked DELIVERED.
     * Performs 3 things atomically:
     *   1. Creates a COMPLETED Transaction record (customer payment)
     *   2. Awards 5% loyalty points to the customer
     *   3. Records the revenue split so every party knows what they're owed
     *
     * Idempotent — skips if a transaction already exists for the order.
     */
    public void createDeliveryTransaction(Order order) {
        if (order == null || order.getStudent() == null) return;
        if (transactionRepository.findByOrder_Id(order.getId()).isPresent()) return;

        BigDecimal totalPaid = order.getTotalAmount();
        BigDecimal deliveryFee = order.getDeliveryFee();
        if (deliveryFee == null) deliveryFee = BigDecimal.ZERO;

        // Product subtotal = what was paid for the goods (excl. delivery)
        BigDecimal productSubtotal = totalPaid.subtract(deliveryFee).max(BigDecimal.ZERO);

        // ── 1. Transaction record (full payment) ──────────────────────────────
        Transaction tx = new Transaction();
        tx.setStudent(order.getStudent());
        tx.setOrder(order);
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            tx.setProduct(order.getItems().get(0).getProduct());
        }
        tx.setAmount(totalPaid);
        tx.setStatus(TransactionStatus.COMPLETED);
        transactionRepository.save(tx);

        // ── 2. Customer loyalty points (5% of product subtotal) ───────────────
        if (!rewardRepository.existsByOrderId(order.getId())) {
            int points = productSubtotal
                    .multiply(BigDecimal.valueOf(0.05))
                    .setScale(0, RoundingMode.FLOOR)
                    .intValue();
            if (points < 1) points = 1;
            rewardRepository.save(new StudentReward(order.getStudent(), order, points, productSubtotal));
        }

        // ── 3. Revenue split ──────────────────────────────────────────────────
        if (!splitRepository.existsByOrderId(order.getId())) {
            BigDecimal shopAmount   = productSubtotal.multiply(SHOP_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal duwazAmount  = productSubtotal.multiply(DUWAZ_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal driverAmount = productSubtotal.multiply(DRIVER_RATE).setScale(2, RoundingMode.HALF_UP);

            splitRepository.save(new RevenueSplit(
                    order, totalPaid, productSubtotal, deliveryFee,
                    shopAmount, duwazAmount, driverAmount));
        }
    }

    /**
     * Records the 10% commission earned by the driver.
     * Called with the driver reference from DeliveryAssignmentService.
     */
    public void recordDriverEarning(Order order, DeliverDriver driver) {
        if (order == null || driver == null) return;
        if (earningRepository.existsByOrderId(order.getId())) return;

        BigDecimal productSubtotal = order.getTotalAmount()
                .subtract(order.getDeliveryFee() != null ? order.getDeliveryFee() : BigDecimal.ZERO)
                .max(BigDecimal.ZERO);

        BigDecimal earning = productSubtotal
                .multiply(DRIVER_RATE)
                .setScale(2, RoundingMode.HALF_UP);

        earningRepository.save(new DriverEarning(driver, order, earning, productSubtotal));
    }

    // ── Revenue summary getters ───────────────────────────────────────────────

    /** Total Duwaz platform revenue */
    public BigDecimal getDuwazTotalRevenue() {
        return splitRepository.sumDuwazRevenue();
    }

    /** Net earnings for a specific shop (after Duwaz 5% and driver 10% deducted) */
    public BigDecimal getShopOwnerRevenue(Long businessId) {
        return splitRepository.sumShopOwnerRevenueByBusiness(businessId);
    }

    /** Total driver commissions earned for a specific driver */
    public BigDecimal getDriverRevenue(Long driverId) {
        return splitRepository.sumDriverRevenueByDriverId(driverId);
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
