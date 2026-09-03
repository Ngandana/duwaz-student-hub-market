package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.classesFolder.Transaction;
import org.example.duwaz.repo.BusinessRepository;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.TransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final StudentRepository studentRepository;
    private final BusinessRepository businessRepository;

    public TransactionController(TransactionService transactionService,
                                  StudentRepository studentRepository,
                                  BusinessRepository businessRepository) {
        this.transactionService = transactionService;
        this.studentRepository = studentRepository;
        this.businessRepository = businessRepository;
    }

    private Optional<Student> currentStudent(Authentication auth) {
        return studentRepository.findByEmail(auth.getName());
    }

    // ── Customer: own transactions ────────────────────────────────────────────

    /** Returns all transactions for the logged-in student */
    @GetMapping("/my")
    public ResponseEntity<?> getMyTransactions(Authentication auth) {
        Optional<Student> studentOpt = currentStudent(auth);
        if (studentOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student not found");
        return ResponseEntity.ok(transactionService.getByStudentId(studentOpt.get().getId()));
    }

    /**
     * Returns a summary for the logged-in student:
     * - totalSpend (sum of COMPLETED transactions)
     * - totalPoints (loyalty points ever earned — lifetime total, doesn't shrink when spent)
     * - availablePoints (totalPoints minus what's already been redeemed — what can actually be spent)
     * - pointsValue (R value of availablePoints — 100 pts = R10)
     * - rewardHistory (list of StudentReward rows)
     */
    @GetMapping("/my/summary")
    public ResponseEntity<?> getMySummary(Authentication auth) {
        Optional<Student> studentOpt = currentStudent(auth);
        if (studentOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student not found");
        Long studentId = studentOpt.get().getId();

        BigDecimal totalSpend      = transactionService.getTotalSpendByStudentId(studentId);
        int        totalPoints     = transactionService.getTotalPointsByStudentId(studentId);
        int        availablePoints = transactionService.getAvailablePoints(studentId);
        // 100 pts = R10 (i.e. 1 pt = R0.10)
        BigDecimal pointsValue = BigDecimal.valueOf(availablePoints).multiply(BigDecimal.valueOf(0.10));

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSpend",       totalSpend);
        summary.put("totalPoints",      totalPoints);
        summary.put("availablePoints",  availablePoints);
        summary.put("pointsValue",      pointsValue);
        summary.put("rewardHistory",    transactionService.getRewardHistoryByStudentId(studentId));
        summary.put("transactions",     transactionService.getByStudentId(studentId));

        return ResponseEntity.ok(summary);
    }

    // ── Admin: all transactions ───────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> getAllTransactions(Authentication auth) {
        Optional<Student> s = currentStudent(auth);
        if (s.isEmpty() || !s.get().isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        }
        return ResponseEntity.ok(transactionService.getByStudentId(null));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getByStudent(@PathVariable Long studentId, Authentication auth) {
        Optional<Student> caller = currentStudent(auth);
        if (caller.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (!caller.get().isAdmin() && !caller.get().getId().equals(studentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return ResponseEntity.ok(transactionService.getByStudentId(studentId));
    }

    // ── Shop owner: net revenue after splits ──────────────────────────────────
    @GetMapping("/my/shop-revenue")
    public ResponseEntity<?> getMyShopRevenue(Authentication auth) {
        Optional<Student> studentOpt = currentStudent(auth);
        if (studentOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student not found");

        return businessRepository.findFirstByStudentEmail(auth.getName())
            .map(biz -> {
                BigDecimal shopRevenue = transactionService.getShopOwnerRevenue(biz.getId());
                return ResponseEntity.ok(Map.of(
                    "businessId",  biz.getId(),
                    "shopRevenue", shopRevenue,
                    "note", "85% of product subtotal — after Duwaz 5% and driver 10% deductions"
                ));
            })
            .orElse(ResponseEntity.ok(Map.of("shopRevenue", 0, "message", "No shop found")));
    }

    // ── Admin: Duwaz platform revenue ─────────────────────────────────────────
    @GetMapping("/admin/revenue")
    public ResponseEntity<?> getAdminRevenue(Authentication auth) {
        Optional<Student> s = currentStudent(auth);
        if (s.isEmpty() || !s.get().isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        }
        BigDecimal duwazRevenue = transactionService.getDuwazTotalRevenue();
        return ResponseEntity.ok(Map.of(
            "duwazRevenue", duwazRevenue,
            "note", "5% platform fee from all delivered orders"
        ));
    }
}
