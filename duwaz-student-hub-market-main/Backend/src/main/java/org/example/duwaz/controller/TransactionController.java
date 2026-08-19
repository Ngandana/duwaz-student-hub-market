package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.classesFolder.Transaction;
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
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;
    private final StudentRepository studentRepository;

    public TransactionController(TransactionService transactionService,
                                  StudentRepository studentRepository) {
        this.transactionService = transactionService;
        this.studentRepository = studentRepository;
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
     * - totalPoints (loyalty points earned)
     * - pointsValue (R value of points — 100 pts = R10)
     * - rewardHistory (list of StudentReward rows)
     */
    @GetMapping("/my/summary")
    public ResponseEntity<?> getMySummary(Authentication auth) {
        Optional<Student> studentOpt = currentStudent(auth);
        if (studentOpt.isEmpty()) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Student not found");
        Long studentId = studentOpt.get().getId();

        BigDecimal totalSpend  = transactionService.getTotalSpendByStudentId(studentId);
        int        totalPoints = transactionService.getTotalPointsByStudentId(studentId);
        // 100 pts = R10 (i.e. 1 pt = R0.10)
        BigDecimal pointsValue = BigDecimal.valueOf(totalPoints).multiply(BigDecimal.valueOf(0.10));

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSpend",    totalSpend);
        summary.put("totalPoints",   totalPoints);
        summary.put("pointsValue",   pointsValue);
        summary.put("rewardHistory", transactionService.getRewardHistoryByStudentId(studentId));
        summary.put("transactions",  transactionService.getByStudentId(studentId));

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
        // Allow own or admin
        if (!caller.get().isAdmin() && !caller.get().getId().equals(studentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return ResponseEntity.ok(transactionService.getByStudentId(studentId));
    }
}
