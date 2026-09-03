package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Order;
import org.example.duwaz.classesFolder.Order.OrderStatus;
import org.example.duwaz.classesFolder.OrderItem;
import org.example.duwaz.classesFolder.Product;
import org.example.duwaz.classesFolder.DeliveryAssignment;
import org.example.duwaz.exception.BadRequestException;
import org.example.duwaz.exception.NotFoundException;
import org.example.duwaz.repo.DeliveryAssignmentRepository;
import org.example.duwaz.repo.OrderRepository;
import org.example.duwaz.repo.ProductRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    // Must mirror the frontend's delivery-fee cap (CartPage.tsx MAX_FEE). The real
    // distance-based figure is computed client-side via geocoding, which isn't
    // practical to replicate here — but nothing should be trusted past this bound.
    private static final BigDecimal MAX_DELIVERY_FEE = BigDecimal.valueOf(20);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final TransactionService transactionService;
    private final DeliveryAssignmentRepository deliveryAssignmentRepository;

    public OrderService(OrderRepository orderRepository,
                         ProductRepository productRepository,
                         ProductService productService,
                         @Lazy TransactionService transactionService,
                         DeliveryAssignmentRepository deliveryAssignmentRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.productService = productService;
        this.transactionService = transactionService;
        this.deliveryAssignmentRepository = deliveryAssignmentRepository;
    }

    /**
     * Creates an order, trusting the DB — not the client — for prices and stock.
     *
     * Previously this saved whatever totalAmount/unitPrice/deliveryFee the client sent
     * verbatim, with no recomputation and no stock check: a modified request could set
     * any price it liked, and stock was never decremented (ProductService had a
     * decrementStockForOrder method that nothing ever called). Both are fixed here.
     */
    public Order createOrder(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }
        if (order.getBusiness() == null || order.getBusiness().getId() == null) {
            throw new BadRequestException("Order must reference a business");
        }

        BigDecimal productSubtotal = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() == null || item.getProduct().getId() == null) {
                throw new BadRequestException("Each order item must reference a product");
            }
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + item.getProduct().getId()));

            if (product.getBusiness() == null || !product.getBusiness().getId().equals(order.getBusiness().getId())) {
                throw new BadRequestException("Product " + product.getName() + " does not belong to the selected shop");
            }

            int qty = item.getQuantity() != null ? item.getQuantity() : 0;
            if (qty <= 0) {
                throw new BadRequestException("Invalid quantity for product " + product.getName());
            }
            if (product.getStockQuantity() < qty) {
                throw new BadRequestException("Not enough stock for " + product.getName()
                        + " (only " + product.getStockQuantity() + " left)");
            }

            // Server is the source of truth for price — never the client's unitPrice.
            item.setProduct(product);
            item.setUnitPrice(product.getPrice());
            item.setOrder(order);
            productSubtotal = productSubtotal.add(product.getPrice().multiply(BigDecimal.valueOf(qty)));
        }

        // Loyalty points redemption — 100 pts = R10, applied against the product
        // subtotal only (never the delivery fee). Must be validated against the
        // student's real available balance, not trusted from the client.
        int pointsRedeemed = order.getPointsRedeemed();
        if (pointsRedeemed > 0) {
            if (order.getStudent() == null || order.getStudent().getId() == null) {
                throw new BadRequestException("Cannot redeem points: no student on this order");
            }
            if (pointsRedeemed % TransactionService.POINTS_PER_REDEMPTION_BLOCK != 0) {
                throw new BadRequestException("Points must be redeemed in blocks of "
                        + TransactionService.POINTS_PER_REDEMPTION_BLOCK);
            }
            int available = transactionService.getAvailablePoints(order.getStudent().getId());
            if (pointsRedeemed > available) {
                throw new BadRequestException("You only have " + available + " points available");
            }
            BigDecimal discount = BigDecimal.valueOf(pointsRedeemed)
                    .divide(BigDecimal.valueOf(TransactionService.POINTS_PER_REDEMPTION_BLOCK))
                    .multiply(TransactionService.REDEMPTION_BLOCK_VALUE);
            if (discount.compareTo(productSubtotal) > 0) {
                throw new BadRequestException("Points discount cannot exceed the order subtotal");
            }
            productSubtotal = productSubtotal.subtract(discount);
        }
        order.setPointsRedeemed(pointsRedeemed);

        BigDecimal deliveryFee = order.getDeliveryFee();
        if (deliveryFee == null || deliveryFee.signum() < 0) deliveryFee = BigDecimal.ZERO;
        if (deliveryFee.compareTo(MAX_DELIVERY_FEE) > 0) deliveryFee = MAX_DELIVERY_FEE;
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(productSubtotal.add(deliveryFee).setScale(2, RoundingMode.HALF_UP));

        Order saved = orderRepository.save(order);

        // Reserve stock now that every item above has been validated as available.
        for (OrderItem item : saved.getItems()) {
            productService.adjustStock(item.getProduct().getId(), -item.getQuantity());
        }

        return saved;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Page<Order> getAllOrdersPaged(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public List<Order> getOrdersByStudentId(Long studentId) {
        return orderRepository.findByStudentId(studentId);
    }

    public List<Order> getOrdersByBusinessId(Long businessId) {
        return orderRepository.findByBusinessId(businessId);
    }

    public Page<Order> getOrdersByBusinessIdPaged(Long businessId, Pageable pageable) {
        return orderRepository.findByBusinessId(businessId, pageable);
    }

    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    public Order updateStatus(Long orderId, OrderStatus newStatus, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        OrderStatus previous = order.getStatus();
        order.setStatus(newStatus);
        if (reason != null && !reason.isEmpty()) {
            order.setCancellationReason(reason);
        }
        Order saved = orderRepository.save(order);

        // Stock was reserved at creation time (see createOrder). If a still-active
        // order is cancelled before being fulfilled, give that stock back.
        boolean wasActive = previous != OrderStatus.CANCELLED && previous != OrderStatus.REFUNDED;
        if (newStatus == OrderStatus.CANCELLED && wasActive) {
            for (OrderItem item : saved.getItems()) {
                if (item.getProduct() != null && item.getProduct().getId() != null && item.getQuantity() != null) {
                    productService.adjustStock(item.getProduct().getId(), item.getQuantity());
                }
            }
        }

        // Settle payment: create the Transaction + loyalty points + revenue split, and
        // the driver's commission if a driver was assigned. This is the single place
        // that triggers settlement regardless of *how* an order reached DELIVERED —
        // whether through the driver-delivery pipeline (DeliveryAssignmentService) or a
        // shop owner/admin marking it delivered directly here. Both call sites are safe
        // to run: createDeliveryTransaction/recordDriverEarning no-op if already recorded.
        if (newStatus == OrderStatus.DELIVERED && previous != OrderStatus.DELIVERED) {
            try {
                transactionService.createDeliveryTransaction(saved);
                Optional<DeliveryAssignment> assignment = deliveryAssignmentRepository.findByOrderId(orderId);
                if (assignment.isPresent() && assignment.get().getDriver() != null) {
                    transactionService.recordDriverEarning(saved, assignment.get().getDriver());
                }
            } catch (Exception e) {
                System.err.println("[OrderService] Transaction/earning creation failed: " + e.getMessage());
            }
        }

        return saved;
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    // Admin stats
    public long countByStatus(OrderStatus status) {
        return orderRepository.countByStatus(status);
    }

    public long countByBusinessAndStatus(Long businessId, OrderStatus status) {
        return orderRepository.countByBusinessIdAndStatus(businessId, status);
    }

    public long countByBusiness(Long businessId) {
        return orderRepository.countByBusinessId(businessId);
    }

    public java.math.BigDecimal sumRevenue() {
        java.math.BigDecimal rev = orderRepository.sumRevenue();
        return rev != null ? rev : java.math.BigDecimal.ZERO;
    }

    public long countAllOrders() {
        return orderRepository.count();
    }
}
