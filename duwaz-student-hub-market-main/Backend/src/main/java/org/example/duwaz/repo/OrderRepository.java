package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStudentId(Long studentId);

    List<Order> findByBusinessId(Long businessId);

    List<Order> findByStatus(Order.OrderStatus status);

    Page<Order> findAll(Pageable pageable);

    Page<Order> findByBusinessId(Long businessId, Pageable pageable);

    Page<Order> findByStudentId(Long studentId, Pageable pageable);

    long countByStatus(Order.OrderStatus status);

    long countByBusinessId(Long businessId);

    long countByBusinessIdAndStatus(Long businessId, Order.OrderStatus status);

    @Query("SELECT COUNT(DISTINCT o.student.id) FROM Order o")
    long countDistinctStudents();

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'DELIVERED'")
    java.math.BigDecimal sumRevenue();
}
