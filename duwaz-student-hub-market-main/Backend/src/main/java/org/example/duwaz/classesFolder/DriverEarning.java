package org.example.duwaz.classesFolder;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Records the 10% commission earned by a driver per delivered order.
 * Created automatically when a delivery is marked DELIVERED.
 */
@Entity
@Table(name = "driver_earnings")
public class DriverEarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private DeliverDriver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({"items", "student", "business", "hibernateLazyInitializer", "handler"})
    private Order order;

    /** 10% of the order total */
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** The full order total this was calculated from */
    @Column(name = "order_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal orderTotal;

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt = LocalDateTime.now();

    @Column(name = "description")
    private String description;

    public DriverEarning() {}

    public DriverEarning(DeliverDriver driver, Order order, BigDecimal amount, BigDecimal orderTotal) {
        this.driver = driver;
        this.order = order;
        this.amount = amount;
        this.orderTotal = orderTotal;
        this.earnedAt = LocalDateTime.now();
        this.description = "10% commission for Order #" + order.getId()
                + " (R" + orderTotal + " order)";
    }

    public Long getId() { return id; }
    public DeliverDriver getDriver() { return driver; }
    public void setDriver(DeliverDriver driver) { this.driver = driver; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getOrderTotal() { return orderTotal; }
    public void setOrderTotal(BigDecimal orderTotal) { this.orderTotal = orderTotal; }
    public LocalDateTime getEarnedAt() { return earnedAt; }
    public void setEarnedAt(LocalDateTime earnedAt) { this.earnedAt = earnedAt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
