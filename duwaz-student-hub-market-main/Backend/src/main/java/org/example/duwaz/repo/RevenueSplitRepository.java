package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.RevenueSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface RevenueSplitRepository extends JpaRepository<RevenueSplit, Long> {

    Optional<RevenueSplit> findByOrderId(Long orderId);
    boolean existsByOrderId(Long orderId);

    /** Total Duwaz platform revenue across all splits */
    @Query("SELECT COALESCE(SUM(r.duwazAmount), 0) FROM RevenueSplit r")
    BigDecimal sumDuwazRevenue();

    /** Total shop owner earnings for a specific business */
    @Query("SELECT COALESCE(SUM(r.shopOwnerAmount), 0) FROM RevenueSplit r WHERE r.order.business.id = :businessId")
    BigDecimal sumShopOwnerRevenueByBusiness(Long businessId);

    /** Total driver commission earned by a specific driver */
    @Query("SELECT COALESCE(SUM(r.driverAmount), 0) FROM RevenueSplit r " +
           "WHERE r.order.id IN (SELECT da.order.id FROM DeliveryAssignment da WHERE da.driver.deliveryDriverId = :driverId)")
    BigDecimal sumDriverRevenueByDriverId(Long driverId);
}
