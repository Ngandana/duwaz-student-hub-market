package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByStudent_Id(Long studentId);
    List<Transaction> findByStatus(Transaction.TransactionStatus status);
    List<Transaction> findByTransactionDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<Transaction> findByAmountBetween(BigDecimal minAmount, BigDecimal maxAmount);
    Optional<Transaction> findByOrder_Id(Long orderId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.student.id = :studentId AND t.status = 'COMPLETED'")
    BigDecimal sumCompletedByStudentId(@Param("studentId") Long studentId);
}
