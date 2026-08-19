package org.example.duwaz.classesFolder;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tracks loyalty points earned by a specific student.
 * Points are awarded at 1% of each completed order total (e.g. R200 order → 2 points).
 * One row per order delivery so the history is fully auditable.
 */
@Entity
@Table(name = "student_rewards")
public class StudentReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"businesses", "password", "hibernateLazyInitializer", "handler"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"items", "student", "business", "hibernateLazyInitializer", "handler"})
    private Order order;

    /** Points awarded for this order (1% of totalAmount, rounded down) */
    @Column(name = "points_earned", nullable = false)
    private int pointsEarned;

    /** Rand value that generated these points */
    @Column(name = "order_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal orderAmount;

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt = LocalDateTime.now();

    @Column(name = "description")
    private String description;

    public StudentReward() {}

    public StudentReward(Student student, Order order, int pointsEarned, BigDecimal orderAmount) {
        this.student = student;
        this.order = order;
        this.pointsEarned = pointsEarned;
        this.orderAmount = orderAmount;
        this.earnedAt = LocalDateTime.now();
        this.description = "Loyalty reward for Order #" + order.getId()
                + " (5% of R" + orderAmount + ")";
    }

    public Long getId() { return id; }
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public int getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(int pointsEarned) { this.pointsEarned = pointsEarned; }
    public BigDecimal getOrderAmount() { return orderAmount; }
    public void setOrderAmount(BigDecimal orderAmount) { this.orderAmount = orderAmount; }
    public LocalDateTime getEarnedAt() { return earnedAt; }
    public void setEarnedAt(LocalDateTime earnedAt) { this.earnedAt = earnedAt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
