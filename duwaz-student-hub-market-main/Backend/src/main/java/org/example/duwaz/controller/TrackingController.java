package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Order;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.dto.TrackingResponse;
import org.example.duwaz.repo.OrderRepository;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.TrackingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Public-facing tracking endpoint consumed by the customer tracking page.
 * GET /api/tracking/order/{orderId}  — returns a full TrackingResponse snapshot.
 * The customer must be authenticated and must own the order (or be ADMIN).
 * Polling this endpoint every 5–10 s gives live driver location updates.
 */
@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*")
public class TrackingController {

    private final TrackingService trackingService;
    private final OrderRepository orderRepository;
    private final StudentRepository studentRepository;

    public TrackingController(TrackingService trackingService,
                               OrderRepository orderRepository,
                               StudentRepository studentRepository) {
        this.trackingService = trackingService;
        this.orderRepository = orderRepository;
        this.studentRepository = studentRepository;
    }

    /**
     * Returns full tracking info for an order.
     * Accessible by the order owner or any ADMIN.
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getOrderTracking(@PathVariable Long orderId,
                                               Authentication auth) {
        // Look up the caller
        Optional<Student> callerOpt = studentRepository.findByEmail(auth.getName());

        // Fetch the order to verify ownership
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();

        // Authorisation: must be the order owner or an admin
        if (callerOpt.isPresent()) {
            Student caller = callerOpt.get();
            boolean isAdmin = caller.isAdmin();
            boolean isOwner = order.getStudent() != null &&
                              order.getStudent().getId().equals(caller.getId());
            if (!isAdmin && !isOwner) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You do not have access to this order");
            }
        } else {
            // Driver tokens will not match a student — drivers cannot access tracking
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Customer or admin access required");
        }

        return trackingService.getTrackingForOrder(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
