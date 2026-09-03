package org.example.duwaz.service;

import org.example.duwaz.classesFolder.*;
import org.example.duwaz.classesFolder.Order.OrderStatus;
import org.example.duwaz.exception.BadRequestException;
import org.example.duwaz.exception.NotFoundException;
import org.example.duwaz.repo.DeliveryAssignmentRepository;
import org.example.duwaz.repo.OrderRepository;
import org.example.duwaz.repo.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Pure unit test — every collaborator is mocked, so this never touches a real
 * database. Covers the order price/stock integrity fixes and the loyalty points
 * redemption feature (see OrderService for the "why" on each of these).
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductService productService;
    @Mock private TransactionService transactionService;
    @Mock private DeliveryAssignmentRepository deliveryAssignmentRepository;

    @InjectMocks
    private OrderService orderService;

    private Business business;
    private Student student;
    private Product product;

    @BeforeEach
    void setUp() {
        business = new Business();
        business.setId(1L);
        business.setName("Test Shop");

        student = new Student();
        student.setId(1L);
        student.setStudentName("Test Student");
        student.setEmail("student@example.com");

        product = new Product();
        product.setId(10L);
        product.setName("Coke");
        product.setPrice(BigDecimal.valueOf(25));
        product.setStockQuantity(10);
        product.setBusiness(business);
    }

    private Order orderWithOneItem(int quantity, BigDecimal fakeUnitPrice) {
        Order order = new Order();
        order.setBusiness(business);
        order.setStudent(student);

        OrderItem item = new OrderItem();
        Product productStub = new Product();
        productStub.setId(product.getId());
        item.setProduct(productStub);
        item.setQuantity(quantity);
        item.setUnitPrice(fakeUnitPrice); // client-supplied — should be ignored

        List<OrderItem> items = new ArrayList<>();
        items.add(item);
        order.setItems(items);

        return order;
    }

    // ── Price/stock integrity ────────────────────────────────────────────────

    @Test
    void createOrder_ignoresClientSuppliedPriceAndUsesRealProductPrice() {
        Order order = orderWithOneItem(2, BigDecimal.valueOf(0.01)); // client lies about price
        order.setDeliveryFee(BigDecimal.valueOf(10));

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order saved = orderService.createOrder(order);

        assertEquals(0, BigDecimal.valueOf(25).compareTo(saved.getItems().get(0).getUnitPrice()));
        assertEquals(0, BigDecimal.valueOf(60.00).compareTo(saved.getTotalAmount())); // 2*25 + 10
        verify(productService).adjustStock(10L, -2); // stock reserved
    }

    @Test
    void createOrder_rejectsInsufficientStock() {
        product.setStockQuantity(1);
        Order order = orderWithOneItem(5, BigDecimal.valueOf(25));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class, () -> orderService.createOrder(order));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_rejectsProductFromADifferentShop() {
        Business otherShop = new Business();
        otherShop.setId(999L);
        product.setBusiness(otherShop);

        Order order = orderWithOneItem(1, BigDecimal.valueOf(25));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class, () -> orderService.createOrder(order));
    }

    @Test
    void createOrder_rejectsUnknownProduct() {
        Order order = orderWithOneItem(1, BigDecimal.valueOf(25));
        when(productRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> orderService.createOrder(order));
    }

    @Test
    void createOrder_capsDeliveryFeeAtMax() {
        Order order = orderWithOneItem(1, BigDecimal.valueOf(25));
        order.setDeliveryFee(BigDecimal.valueOf(9999)); // client lies about the fee too

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order saved = orderService.createOrder(order);

        assertEquals(0, BigDecimal.valueOf(20).compareTo(saved.getDeliveryFee())); // capped
        assertEquals(0, BigDecimal.valueOf(45.00).compareTo(saved.getTotalAmount())); // 25 + 20
    }

    // ── Points redemption ────────────────────────────────────────────────────

    @Test
    void createOrder_appliesValidPointsRedemption() {
        Order order = orderWithOneItem(1, BigDecimal.valueOf(25));
        order.setDeliveryFee(BigDecimal.valueOf(10));
        order.setPointsRedeemed(100); // 100 pts = R10

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(transactionService.getAvailablePoints(1L)).thenReturn(150);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        Order saved = orderService.createOrder(order);

        // 25 (product) - 10 (points discount) + 10 (delivery) = 25
        assertEquals(0, BigDecimal.valueOf(25.00).compareTo(saved.getTotalAmount()));
        assertEquals(100, saved.getPointsRedeemed());
    }

    @Test
    void createOrder_rejectsRedeemingMorePointsThanAvailable() {
        Order order = orderWithOneItem(1, BigDecimal.valueOf(25));
        order.setPointsRedeemed(200);

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(transactionService.getAvailablePoints(1L)).thenReturn(100);

        assertThrows(BadRequestException.class, () -> orderService.createOrder(order));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createOrder_rejectsRedemptionNotAMultipleOf100() {
        // The modulo check happens before the balance lookup, so getAvailablePoints
        // is never called here — no stub needed for it.
        Order order = orderWithOneItem(1, BigDecimal.valueOf(25));
        order.setPointsRedeemed(50);

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class, () -> orderService.createOrder(order));
    }

    @Test
    void createOrder_rejectsDiscountLargerThanSubtotal() {
        // Product subtotal is only R25 — redeeming 300 pts (worth R30) would push it negative.
        Order order = orderWithOneItem(1, BigDecimal.valueOf(25));
        order.setPointsRedeemed(300);

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(transactionService.getAvailablePoints(1L)).thenReturn(1000);

        assertThrows(BadRequestException.class, () -> orderService.createOrder(order));
    }

    // ── Status transitions ───────────────────────────────────────────────────

    @Test
    void updateStatus_cancellingAnActiveOrderRestocksItems() {
        Order order = new Order();
        order.setId(5L);
        order.setStatus(OrderStatus.PENDING);
        OrderItem item = new OrderItem();
        Product p = new Product();
        p.setId(10L);
        item.setProduct(p);
        item.setQuantity(3);
        order.setItems(List.of(item));

        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.updateStatus(5L, OrderStatus.CANCELLED, "changed my mind");

        verify(productService).adjustStock(10L, 3); // given back
    }

    @Test
    void updateStatus_deliveredTriggersSettlementOnce() {
        Order order = new Order();
        order.setId(5L);
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        order.setItems(List.of());

        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(deliveryAssignmentRepository.findByOrderId(5L)).thenReturn(Optional.empty());

        orderService.updateStatus(5L, OrderStatus.DELIVERED, null);

        verify(transactionService, times(1)).createDeliveryTransaction(any(Order.class));
    }

    @Test
    void updateStatus_alreadyDeliveredDoesNotSettleAgain() {
        Order order = new Order();
        order.setId(5L);
        order.setStatus(OrderStatus.DELIVERED); // already delivered
        order.setItems(List.of());

        when(orderRepository.findById(5L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.updateStatus(5L, OrderStatus.DELIVERED, null);

        verify(transactionService, never()).createDeliveryTransaction(any());
    }
}
