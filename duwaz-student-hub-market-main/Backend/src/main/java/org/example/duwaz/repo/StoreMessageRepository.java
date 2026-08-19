package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.StoreMessage;
import org.example.duwaz.classesFolder.StoreMessage.MessageStatus;
import org.example.duwaz.classesFolder.StoreMessage.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreMessageRepository extends JpaRepository<StoreMessage, Long> {
    List<StoreMessage> findByBusinessIdOrderBySentAtDesc(Long businessId);
    List<StoreMessage> findByDriverDeliveryDriverIdOrderBySentAtDesc(Long driverId);
    List<StoreMessage> findByStatusOrderBySentAtDesc(MessageStatus status);
    List<StoreMessage> findAllByOrderBySentAtDesc();
    Optional<StoreMessage> findByOrderId(Long orderId);
    boolean existsByOrderIdAndMessageType(Long orderId, MessageType type);
    long countByStatusAndFromAdminFalse(MessageStatus status);
    // Count unread messages for a specific driver
    long countByDriverDeliveryDriverIdAndStatusAndFromAdminTrue(Long driverId, MessageStatus status);
}
