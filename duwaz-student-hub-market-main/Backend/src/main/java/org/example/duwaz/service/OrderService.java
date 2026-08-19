package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Order;
import org.example.duwaz.classesFolder.Order.OrderStatus;
import org.example.duwaz.classesFolder.OrderItem;
import org.example.duwaz.repo.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(Order order) {
        // Link each item back to the order
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                item.setOrder(order);
            }
        }
        return orderRepository.save(order);
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
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        order.setStatus(newStatus);
        if (reason != null && !reason.isEmpty()) {
            order.setCancellationReason(reason);
        }
        return orderRepository.save(order);
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
