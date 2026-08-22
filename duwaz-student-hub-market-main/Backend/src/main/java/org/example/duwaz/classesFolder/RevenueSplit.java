package org.example.duwaz.classesFolder;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Records how the money from a delivered order is divided between all parties.
 *
 * Split formula (applied to product subtotal only, excl. delivery fee):
 *   Shop owner  → 85%  (their product price minus platform and driver cuts)
 *   Duwaz admin → 5%   (platform fee)
 *   Driver      → 10%  (delivery commission)
 *
 * The delivery fee is kept separate and goes to driver + operations.
 */
@Entity
@Table(name = "revenue_splits")
public class RevenueSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"items", "student", "business", "hibernateLazyInitializer", "handler"})
    private Order order;

    /** Full amount the customer paid */
    @Column(name = "total_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPaid;

    /** Product subtotal (total_paid − delivery_fee) */
    @Column(name = "product_subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal productSubtotal;

    /** Delivery fee portion */
    @Column(name = "delivery_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    /** 85% of productSubtotal → shop owner */
    @Column(name = "shop_owner_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal shopOwnerAmount;

    /** 5% of productSubtotal → Duwaz platform */
    @Column(name = "duwaz_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal duwazAmount;

    /** 10% of productSubtotal → driver commission */
    @Column(name = "driver_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal driverAmount;

    @Column(name = "split_at", nullable = false)
    private LocalDateTime splitAt = LocalDateTime.now();

    public RevenueSplit() {}

    public RevenueSplit(Order order,
                         BigDecimal totalPaid,
                         BigDecimal productSubtotal,
                         BigDecimal deliveryFee,
                         BigDecimal shopOwnerAmount,
                         BigDecimal duwazAmount,
                         BigDecimal driverAmount) {
        this.order           = order;
        this.totalPaid       = totalPaid;
        this.productSubtotal = productSubtotal;
        this.deliveryFee     = deliveryFee;
        this.shopOwnerAmount = shopOwnerAmount;
        this.duwazAmount     = duwazAmount;
        this.driverAmount    = driverAmount;
        this.splitAt         = LocalDateTime.now();
    }

    public Long getId()                       { return id; }
    public Order getOrder()                   { return order; }
    public void setOrder(Order order)         { this.order = order; }
    public BigDecimal getTotalPaid()          { return totalPaid; }
    public void setTotalPaid(BigDecimal v)    { this.totalPaid = v; }
    public BigDecimal getProductSubtotal()    { return productSubtotal; }
    public void setProductSubtotal(BigDecimal v) { this.productSubtotal = v; }
    public BigDecimal getDeliveryFee()        { return deliveryFee; }
    public void setDeliveryFee(BigDecimal v)  { this.deliveryFee = v; }
    public BigDecimal getShopOwnerAmount()    { return shopOwnerAmount; }
    public void setShopOwnerAmount(BigDecimal v) { this.shopOwnerAmount = v; }
    public BigDecimal getDuwazAmount()        { return duwazAmount; }
    public void setDuwazAmount(BigDecimal v)  { this.duwazAmount = v; }
    public BigDecimal getDriverAmount()       { return driverAmount; }
    public void setDriverAmount(BigDecimal v) { this.driverAmount = v; }
    public LocalDateTime getSplitAt()         { return splitAt; }
    public void setSplitAt(LocalDateTime v)   { this.splitAt = v; }
}
