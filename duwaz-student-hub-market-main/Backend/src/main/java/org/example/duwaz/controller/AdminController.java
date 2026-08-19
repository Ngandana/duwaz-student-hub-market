package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.DeliverDriver.DriverStatus;
import org.example.duwaz.classesFolder.Order.OrderStatus;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.repo.BusinessRepository;
import org.example.duwaz.repo.DeliverDriverRepository;
import org.example.duwaz.repo.ProductRepository;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final StudentRepository studentRepository;
    private final BusinessRepository businessRepository;
    private final ProductRepository productRepository;
    private final OrderService orderService;
    private final DeliverDriverRepository driverRepository;

    public AdminController(StudentRepository studentRepository,
                           BusinessRepository businessRepository,
                           ProductRepository productRepository,
                           OrderService orderService,
                           DeliverDriverRepository driverRepository) {
        this.studentRepository = studentRepository;
        this.businessRepository = businessRepository;
        this.productRepository = productRepository;
        this.orderService = orderService;
        this.driverRepository = driverRepository;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        Student student = studentRepository.findByEmail(auth.getName()).orElse(null);
        return student != null && student.isAdmin();
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", studentRepository.count());
        stats.put("totalShops", businessRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("totalOrders", orderService.countAllOrders());
        stats.put("pendingOrders", orderService.countByStatus(OrderStatus.PENDING));
        stats.put("confirmedOrders", orderService.countByStatus(OrderStatus.CONFIRMED));
        stats.put("preparingOrders", orderService.countByStatus(OrderStatus.PREPARING));
        stats.put("deliveredOrders", orderService.countByStatus(OrderStatus.DELIVERED));
        stats.put("cancelledOrders", orderService.countByStatus(OrderStatus.CANCELLED));
        stats.put("totalRevenue", orderService.sumRevenue());
        stats.put("totalDrivers", driverRepository.count());
        stats.put("availableDrivers", driverRepository.findByStatusAndActiveTrue(DriverStatus.AVAILABLE).size());
        stats.put("busyDrivers", driverRepository.findByStatus(DriverStatus.BUSY).size());
        stats.put("outForDelivery", orderService.countByStatus(OrderStatus.OUT_FOR_DELIVERY));
        stats.put("readyForPickup", orderService.countByStatus(OrderStatus.READY_FOR_PICKUP));

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id,
                                             @RequestBody Map<String, String> body,
                                             Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        try {
            Student.Role role = Student.Role.valueOf(body.get("role").toUpperCase());
            student.setRole(role);
            return ResponseEntity.ok(studentRepository.save(student));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role");
        }
    }
}
