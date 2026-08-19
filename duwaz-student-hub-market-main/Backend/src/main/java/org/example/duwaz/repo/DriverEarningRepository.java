package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.DriverEarning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DriverEarningRepository extends JpaRepository<DriverEarning, Long> {

    List<DriverEarning> findByDriverDeliveryDriverIdOrderByEarnedAtDesc(Long driverId);

    boolean existsByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM DriverEarning e WHERE e.driver.deliveryDriverId = :driverId")
    BigDecimal sumByDriverId(@Param("driverId") Long driverId);
}
