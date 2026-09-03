package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.classesFolder.Order;
import org.example.duwaz.classesFolder.Order.OrderStatus;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.dto.response.DtoMapper;
import org.example.duwaz.dto.response.OrderDTO;
import org.example.duwaz.repo.BusinessRepository;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final StudentRepository studentRepository;
    private final BusinessRepository businessRepository;

    public OrderController(OrderService orderService,
                           StudentRepository studentRepository,
                           BusinessRepository businessRepository) {
        this.orderService = orderService;
        this.studentRepository = studentRepository;
        this.businessRepository = businessRepository;
    }

    // ── Customer: place order ─────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody Order order, Authentication auth) {
        String email = auth.getName();
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        order.setStudent(student);

        // Resolve business from its id (Jackson gives us a detached object with only id set)
        if (order.getBusiness() != null && order.getBusiness().getId() != null) {
            Business business = businessRepository.findById(order.getBusiness().getId())
                    .orElseThrow(() -> new RuntimeException("Shop not found: " + order.getBusiness().getId()));
            order.setBusiness(business);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(DtoMapper.toDto(orderService.createOrder(order)));
    }

    // ── Customer: my orders ───────────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<OrderDTO>> getMyOrders(Authentication auth) {
        String email = auth.getName();
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return ResponseEntity.ok(DtoMapper.orderList(orderService.getOrdersByStudentId(student.getId())));
    }

    // ── Customer: cancel own order ────────────────────────────────────────────
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id,
                                          @RequestBody(required = false) Map<String, String> body,
                                          Authentication auth) {
        String email = auth.getName();
        Optional<Order> opt = orderService.getOrderById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Order order = opt.get();

        // Only owner or admin can cancel
        boolean isOwner = order.getStudent() != null &&
                order.getStudent().getEmail().equals(email);
        Student requester = studentRepository.findByEmail(email).orElse(null);
        boolean isAdmin = requester != null && requester.isAdmin();

        if (!isOwner && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not your order");
        }
        if (order.getStatus() == OrderStatus.DELIVERED ||
            order.getStatus() == OrderStatus.CANCELLED) {
            return ResponseEntity.badRequest().body("Cannot cancel a " + order.getStatus() + " order");
        }

        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(DtoMapper.toDto(orderService.updateStatus(id, OrderStatus.CANCELLED, reason)));
    }

    // ── Shop owner: orders for my shop ────────────────────────────────────────
    @GetMapping("/shop")
    public ResponseEntity<?> getShopOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        String email = auth.getName();
        Optional<Business> biz = businessRepository.findFirstByStudentEmail(email);
        if (biz.isEmpty()) return ResponseEntity.ok(List.of());
        Page<Order> orders = orderService.getOrdersByBusinessIdPaged(
                biz.get().getId(),
                PageRequest.of(page, size, Sort.by("orderDate").descending()));
        return ResponseEntity.ok(DtoMapper.orderPage(orders));
    }

    // ── Admin: all orders (paginated) ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        Student requester = studentRepository.findByEmail(auth.getName()).orElse(null);
        if (requester == null || !requester.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        Page<Order> orders = orderService.getAllOrdersPaged(
                PageRequest.of(page, size, Sort.by("orderDate").descending()));
        return ResponseEntity.ok(DtoMapper.orderPage(orders));
    }

    // ── Admin: get by id ──────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id, Authentication auth) {
        Optional<Order> opt = orderService.getOrderById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Order order = opt.get();
        String email = auth.getName();
        Student requester = studentRepository.findByEmail(email).orElse(null);
        if (requester == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        boolean isAdmin = requester.isAdmin();
        boolean isCustomer = order.getStudent() != null &&
                order.getStudent().getEmail().equals(email);
        boolean isShopOwner = order.getBusiness() != null &&
                order.getBusiness().getStudent() != null &&
                order.getBusiness().getStudent().getEmail().equals(email);

        if (!isAdmin && !isCustomer && !isShopOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return ResponseEntity.ok(DtoMapper.toDto(order));
    }

    // ── Admin + Shop owner: update order status ───────────────────────────────
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody Map<String, String> body,
                                           Authentication auth) {
        Optional<Order> opt = orderService.getOrderById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Order order = opt.get();
        String email = auth.getName();
        Student requester = studentRepository.findByEmail(email).orElse(null);
        if (requester == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        boolean isAdmin = requester.isAdmin();
        boolean isShopOwner = order.getBusiness() != null &&
                order.getBusiness().getStudent() != null &&
                order.getBusiness().getStudent().getEmail().equals(email);

        if (!isAdmin && !isShopOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to update this order");
        }

        String statusStr = body.get("status");
        String reason = body.get("reason");
        try {
            OrderStatus newStatus = OrderStatus.valueOf(statusStr);
            return ResponseEntity.ok(DtoMapper.toDto(orderService.updateStatus(id, newStatus, reason)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status: " + statusStr);
        }
    }

    // ── Admin: get by student ─────────────────────────────────────────────────
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getOrdersByStudentId(@PathVariable Long studentId, Authentication auth) {
        Student requester = studentRepository.findByEmail(auth.getName()).orElse(null);
        if (requester == null || !requester.isAdmin()) {
            // customers can only see their own
            if (requester != null && requester.getId().equals(studentId)) {
                return ResponseEntity.ok(DtoMapper.orderList(orderService.getOrdersByStudentId(studentId)));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return ResponseEntity.ok(DtoMapper.orderList(orderService.getOrdersByStudentId(studentId)));
    }

    // ── Admin: get by status ──────────────────────────────────────────────────
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getOrdersByStatus(@PathVariable String status, Authentication auth) {
        Student requester = studentRepository.findByEmail(auth.getName()).orElse(null);
        if (requester == null || !requester.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        try {
            OrderStatus s = OrderStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(DtoMapper.orderList(orderService.getOrdersByStatus(s)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status: " + status);
        }
    }

    // ── Admin: delete order ───────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id, Authentication auth) {
        Student requester = studentRepository.findByEmail(auth.getName()).orElse(null);
        if (requester == null || !requester.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
