package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.classesFolder.StoreMessage;
import org.example.duwaz.classesFolder.StoreMessage.MessageStatus;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.repo.BusinessRepository;
import org.example.duwaz.repo.DeliverDriverRepository;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.StoreMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class StoreMessageController {

    private final StoreMessageService messageService;
    private final BusinessRepository businessRepository;
    private final StudentRepository studentRepository;
    private final DeliverDriverRepository driverRepository;

    public StoreMessageController(StoreMessageService messageService,
                                   BusinessRepository businessRepository,
                                   StudentRepository studentRepository,
                                   DeliverDriverRepository driverRepository) {
        this.messageService = messageService;
        this.businessRepository = businessRepository;
        this.studentRepository = studentRepository;
        this.driverRepository = driverRepository;
    }

    private boolean isAdmin(Authentication auth) {
        Student s = studentRepository.findByEmail(auth.getName()).orElse(null);
        return s != null && s.isAdmin();
    }

    private Optional<Business> getOwnerBusiness(Authentication auth) {
        return businessRepository.findFirstByStudentEmail(auth.getName());
    }

    private Optional<DeliverDriver> getDriverFromAuth(Authentication auth) {
        return driverRepository.findByEmail(auth.getName());
    }

    // ── Shop owner endpoints ──────────────────────────────────────────────────

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> body, Authentication auth) {
        Optional<Business> biz = getOwnerBusiness(auth);
        if (biz.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't own a shop");
        String subject = body.getOrDefault("subject", "General Enquiry");
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) return ResponseEntity.badRequest().body("Content required");
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.sendMessage(biz.get(), subject, content));
    }

    @PostMapping("/request-delivery/{orderId}")
    public ResponseEntity<?> requestDelivery(@PathVariable Long orderId, Authentication auth) {
        Optional<Business> biz = getOwnerBusiness(auth);
        if (biz.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't own a shop");
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(messageService.requestDelivery(biz.get(), orderId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyMessages(Authentication auth) {
        Optional<Business> biz = getOwnerBusiness(auth);
        if (biz.isEmpty()) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(messageService.getMessagesForBusiness(biz.get().getId()));
    }

    // ── Driver endpoints ──────────────────────────────────────────────────────

    /** Driver gets their messages from admin */
    @GetMapping("/driver/mine")
    public ResponseEntity<?> getMyDriverMessages(Authentication auth) {
        Optional<DeliverDriver> driverOpt = getDriverFromAuth(auth);
        if (driverOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Driver access only");
        return ResponseEntity.ok(messageService.getMessagesForDriver(driverOpt.get().getDeliveryDriverId()));
    }

    /** Driver gets count of unread messages */
    @GetMapping("/driver/unread-count")
    public ResponseEntity<?> getDriverUnreadCount(Authentication auth) {
        Optional<DeliverDriver> driverOpt = getDriverFromAuth(auth);
        if (driverOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Driver access only");
        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", messageService.countUnreadForDriver(driverOpt.get().getDeliveryDriverId()));
        return ResponseEntity.ok(result);
    }

    /** Driver replies to an admin message */
    @PutMapping("/driver/{id}/reply")
    public ResponseEntity<?> driverReply(@PathVariable Long id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        Optional<DeliverDriver> driverOpt = getDriverFromAuth(auth);
        if (driverOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Driver access only");
        String replyContent = body.get("replyContent");
        if (replyContent == null || replyContent.trim().isEmpty()) return ResponseEntity.badRequest().body("replyContent required");
        try {
            return ResponseEntity.ok(messageService.driverReply(id, replyContent));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Driver marks a message as read */
    @PutMapping("/driver/{id}/read")
    public ResponseEntity<?> driverMarkRead(@PathVariable Long id, Authentication auth) {
        Optional<DeliverDriver> driverOpt = getDriverFromAuth(auth);
        if (driverOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Driver access only");
        try {
            return ResponseEntity.ok(messageService.markRead(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> getAllMessages(@RequestParam(required = false) String status, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            try {
                MessageStatus s = MessageStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(messageService.getByStatus(s));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid status: " + status);
            }
        }
        return ResponseEntity.ok(messageService.getAllMessages());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", messageService.countUnread());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        try {
            return ResponseEntity.ok(messageService.markRead(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/reply")
    public ResponseEntity<?> reply(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        String replyContent = body.get("replyContent");
        if (replyContent == null || replyContent.trim().isEmpty()) return ResponseEntity.badRequest().body("replyContent required");
        try {
            return ResponseEntity.ok(messageService.adminReply(id, replyContent));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        try {
            return ResponseEntity.ok(messageService.resolve(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Admin sends a direct message to a specific driver */
    @PostMapping("/send-to-driver")
    public ResponseEntity<?> sendToDriver(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        Long driverId = Long.valueOf(body.get("driverId").toString());
        Long orderId = body.containsKey("orderId") ? Long.valueOf(body.get("orderId").toString()) : null;
        String subject = body.getOrDefault("subject", "Message from Admin").toString();
        String content = body.get("content") != null ? body.get("content").toString() : "";
        if (content.trim().isEmpty()) return ResponseEntity.badRequest().body("content required");
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(messageService.sendToDriver(driverId, orderId, subject, content));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Admin forwards a delivery request message to a driver */
    @PostMapping("/{id}/forward-to-driver/{driverId}")
    public ResponseEntity<?> forwardToDriver(@PathVariable Long id,
                                              @PathVariable Long driverId,
                                              Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        try {
            return ResponseEntity.ok(messageService.forwardDeliveryRequest(id, driverId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
