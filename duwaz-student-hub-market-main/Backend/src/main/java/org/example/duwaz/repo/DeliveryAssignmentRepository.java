package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.DeliveryAssignment;
import org.example.duwaz.classesFolder.DeliveryAssignment.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryAssignmentRepository extends JpaRepository<DeliveryAssignment, Long> {
    List<DeliveryAssignment> findByDriverDeliveryDriverId(Long driverId);
    List<DeliveryAssignment> findByDriverDeliveryDriverIdAndDeliveryStatus(Long driverId, DeliveryStatus status);
    Optional<DeliveryAssignment> findByOrderId(Long orderId);
    List<DeliveryAssignment> findByDeliveryStatus(DeliveryStatus status);
    long countByDriverDeliveryDriverIdAndDeliveryStatus(Long driverId, DeliveryStatus status);
}
