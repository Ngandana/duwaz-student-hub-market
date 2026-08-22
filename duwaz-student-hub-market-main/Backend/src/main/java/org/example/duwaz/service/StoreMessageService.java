package org.example.duwaz.service;

import org.example.duwaz.classesFolder.*;
import org.example.duwaz.classesFolder.StoreMessage.MessageStatus;
import org.example.duwaz.classesFolder.StoreMessage.MessageType;
import org.example.duwaz.repo.DeliverDriverRepository;
import org.example.duwaz.repo.DeliveryAssignmentRepository;
import org.example.duwaz.repo.OrderRepository;
import org.example.duwaz.repo.StoreMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StoreMessageService {

    private final StoreMessageRepository messageRepository;
    private final OrderRepository orderRepository;
    private final DeliverDriverRepository driverRepository;
    private final DeliveryAssignmentRepository assignmentRepository;

    public StoreMessageService(StoreMessageRepository messageRepository,
                                OrderRepository orderRepository,
                                DeliverDriverRepository driverRepository,
                                DeliveryAssignmentRepository assignmentRepository) {
        this.messageRepository = messageRepository;
        this.orderRepository = orderRepository;
        this.driverRepository = driverRepository;
        this.assignmentRepository = assignmentRepository;
    }

    // ── Shop owner → Admin ────────────────────────────────────────────────────

    public StoreMessage sendMessage(Business business, String subject, String content) {
        StoreMessage msg = new StoreMessage();
        msg.setBusiness(business);
        msg.setMessageType(MessageType.MESSAGE);
        msg.setSubject(subject);
        msg.setContent(content);
        msg.setStatus(MessageStatus.UNREAD);
        msg.setFromAdmin(false);
        return messageRepository.save(msg);
    }

    public StoreMessage requestDelivery(Business business, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (messageRepository.existsByOrderIdAndMessageType(orderId, MessageType.DELIVERY_REQUEST)) {
            throw new RuntimeException("Delivery request already submitted for order #" + orderId);
        }

        StringBuilder content = new StringBuilder();
        content.append("🚚 DELIVERY REQUEST\n\n");
        content.append("=== ORDER INFORMATION ===\n");
        content.append("Order ID: #").append(order.getId()).append("\n");
        content.append("Order Date: ").append(order.getOrderDate()).append("\n");
        content.append("Total Amount: R").append(order.getTotalAmount()).append("\n");
        content.append("Status: ").append(order.getStatus()).append("\n");
        if (order.getDeliveryAddress() != null) {
            content.append("Delivery Address: ").append(order.getDeliveryAddress()).append("\n");
        }
        content.append("\n=== CUSTOMER INFORMATION ===\n");
        if (order.getStudent() != null) {
            content.append("Customer: ").append(order.getStudent().getStudentName()).append("\n");
            content.append("Email: ").append(order.getStudent().getEmail()).append("\n");
        }
        content.append("\n=== PRODUCTS ===\n");
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                content.append("• ").append(item.getProduct() != null ? item.getProduct().getName() : "Product")
                        .append(" × ").append(item.getQuantity())
                        .append(" @ R").append(item.getUnitPrice()).append("\n");
            }
        }
        content.append("\n=== STORE INFORMATION ===\n");
        content.append("Store: ").append(business.getBusinessName()).append("\n");
        if (business.getStudent() != null) {
            content.append("Owner: ").append(business.getStudent().getStudentName()).append("\n");
            content.append("Owner Email: ").append(business.getStudent().getEmail()).append("\n");
        }

        StoreMessage msg = new StoreMessage();
        msg.setBusiness(business);
        msg.setOrder(order);
        msg.setMessageType(MessageType.DELIVERY_REQUEST);
        msg.setSubject("Delivery Request — Order #" + orderId);
        msg.setContent(content.toString());
        msg.setStatus(MessageStatus.UNREAD);
        msg.setFromAdmin(false);

        order.setStatus(Order.OrderStatus.READY_FOR_PICKUP);
        orderRepository.save(order);

        return messageRepository.save(msg);
    }

    // ── Admin → Driver ────────────────────────────────────────────────────────

    /**
     * Admin sends a direct message to a driver (can include order context).
     */
    public StoreMessage sendToDriver(Long driverId, Long orderId, String subject, String content) {
        DeliverDriver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found: " + driverId));

        StoreMessage msg = new StoreMessage();
        msg.setDriver(driver);
        msg.setMessageType(MessageType.DRIVER_MESSAGE);
        msg.setSubject(subject);
        msg.setContent(content);
        msg.setStatus(MessageStatus.UNREAD);
        msg.setFromAdmin(true);

        if (orderId != null) {
            orderRepository.findById(orderId).ifPresent(msg::setOrder);
        }

        return messageRepository.save(msg);
    }

    /**
     * Admin forwards a delivery request to a specific driver.
     * Generates structured content with all order/customer/shop details.
     */
    public StoreMessage forwardDeliveryRequest(Long originalMessageId, Long driverId) {
        StoreMessage original = messageRepository.findById(originalMessageId)
                .orElseThrow(() -> new RuntimeException("Message not found: " + originalMessageId));

        DeliverDriver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found: " + driverId));

        Order order = original.getOrder();

        StringBuilder content = new StringBuilder();
        content.append("📦 DELIVERY ASSIGNMENT FROM ADMIN\n\n");

        if (order != null) {
            content.append("=== ORDER DETAILS ===\n");
            content.append("Order #").append(order.getId()).append("\n");
            content.append("Total: R").append(order.getTotalAmount()).append("\n");
            if (order.getDeliveryAddress() != null) {
                content.append("Deliver to: ").append(order.getDeliveryAddress()).append("\n");
            }
            if (order.getStudent() != null) {
                content.append("\n=== CUSTOMER ===\n");
                content.append("Name: ").append(order.getStudent().getStudentName()).append("\n");
                content.append("Email: ").append(order.getStudent().getEmail()).append("\n");
            }
            if (order.getItems() != null && !order.getItems().isEmpty()) {
                content.append("\n=== PRODUCTS ===\n");
                for (OrderItem item : order.getItems()) {
                    content.append("• ").append(item.getProduct() != null ? item.getProduct().getName() : "Product")
                            .append(" × ").append(item.getQuantity()).append("\n");
                }
            }
            if (original.getBusiness() != null) {
                content.append("\n=== PICKUP FROM ===\n");
                content.append("Shop: ").append(original.getBusiness().getBusinessName()).append("\n");
                if (original.getBusiness().getStudent() != null) {
                    content.append("Contact: ").append(original.getBusiness().getStudent().getEmail()).append("\n");
                }
            }
        } else {
            content.append(original.getContent());
        }

        StoreMessage driverMsg = new StoreMessage();
        driverMsg.setDriver(driver);
        driverMsg.setBusiness(original.getBusiness());
        driverMsg.setOrder(order);
        driverMsg.setMessageType(MessageType.DRIVER_MESSAGE);
        driverMsg.setSubject("Delivery Assignment" + (order != null ? " — Order #" + order.getId() : ""));
        driverMsg.setContent(content.toString());
        driverMsg.setStatus(MessageStatus.UNREAD);
        driverMsg.setFromAdmin(true);

        // Mark original as resolved
        original.setStatus(MessageStatus.RESOLVED);
        messageRepository.save(original);

        return messageRepository.save(driverMsg);
    }

    // ── Auto-resolve delivery request when driver is assigned ─────────────────

    /**
     * Marks the DELIVERY_REQUEST message for a given order as RESOLVED.
     * Called automatically when admin assigns a driver — the request is dealt with.
     */
    public void resolveDeliveryRequestForOrder(Long orderId) {
        messageRepository.findAllByOrderIdOrderBySentAtDesc(orderId).stream()
                .filter(m -> m.getMessageType() == MessageType.DELIVERY_REQUEST
                        && m.getStatus() != MessageStatus.RESOLVED)
                .forEach(m -> {
                    m.setStatus(MessageStatus.RESOLVED);
                    messageRepository.save(m);
                });
    }

    // ── Driver → Admin + Shop: status update notifications ───────────────────

    /**
     * Called after every delivery status change.
     * Sends a structured notification to both Admin and the shop owner.
     */
    public void notifyStatusChange(DeliveryAssignment assignment) {
        DeliverDriver driver = assignment.getDriver();
        Order order = assignment.getOrder();
        if (order == null || driver == null) return;

        String driverName = driver.getFirstName() + " " + driver.getLastName();
        DeliveryAssignment.DeliveryStatus status = assignment.getDeliveryStatus();

        // ── Build status-specific subject + summary ───────────────────────────
        String emoji;
        String headline;
        String detail;

        switch (status) {
            case DRIVER_ACCEPTED -> {
                emoji = "✅";
                headline = "Driver Accepted — Heading to Shop";
                detail = driverName + " has accepted Order #" + order.getId()
                        + " and is on the way to collect it from your shop.";
            }
            case TRAVELLING_TO_SHOP -> {
                emoji = "🏎️";
                headline = "Driver Travelling to Shop";
                detail = driverName + " is now travelling to the shop to pick up Order #" + order.getId() + ".";
            }
            case PICKED_UP -> {
                emoji = "📦";
                headline = "Order Picked Up from Shop";
                detail = driverName + " has collected Order #" + order.getId()
                        + " from the shop and is heading to the customer.";
            }
            case TRAVELLING_TO_CUSTOMER -> {
                emoji = "🚗";
                headline = "Driver On the Way to Customer";
                detail = driverName + " is delivering Order #" + order.getId() + " to the customer.";
            }
            case ARRIVED -> {
                emoji = "📍";
                headline = "Driver Arrived at Customer Location";
                detail = driverName + " has arrived at the customer's location for Order #" + order.getId()
                        + ". Awaiting OTP confirmation.";
            }
            case DELIVERED -> {
                emoji = "🎉";
                headline = "Order Successfully Delivered";
                detail = "Order #" + order.getId() + " has been delivered successfully by " + driverName + ".";
            }
            case DELIVERY_FAILED -> {
                emoji = "❌";
                headline = "Delivery Failed";
                detail = "Order #" + order.getId() + " could not be delivered by " + driverName + "."
                        + (assignment.getFailureReason() != null
                            ? "\nReason: " + assignment.getFailureReason() : "");
            }
            case CANCELLED -> {
                emoji = "🚫";
                headline = "Delivery Cancelled";
                detail = "Delivery for Order #" + order.getId() + " was cancelled."
                        + (assignment.getFailureReason() != null
                            ? "\nReason: " + assignment.getFailureReason() : "");
            }
            default -> {
                emoji = "ℹ️";
                headline = "Delivery Update";
                detail = "Order #" + order.getId() + " status changed to: " + status.name().replace('_', ' ');
            }
        }

        String subject = emoji + " " + headline + " — Order #" + order.getId();

        StringBuilder body = new StringBuilder();
        body.append(emoji).append(" ").append(headline.toUpperCase()).append("\n\n");
        body.append(detail).append("\n\n");
        body.append("=== DELIVERY DETAILS ===\n");
        body.append("Order #: ").append(order.getId()).append("\n");
        body.append("Order Total: R").append(order.getTotalAmount()).append("\n");
        if (order.getDeliveryAddress() != null) {
            body.append("Delivery Address: ").append(order.getDeliveryAddress()).append("\n");
        }
        if (order.getStudent() != null) {
            body.append("Customer: ").append(order.getStudent().getStudentName()).append("\n");
        }
        body.append("\n=== DRIVER ===\n");
        body.append("Name: ").append(driverName).append("\n");
        body.append("Vehicle: ").append(driver.getVehicleType()).append("\n");
        body.append("Contact: ").append(driver.getContactNumber()).append("\n");
        body.append("\nStatus at: ").append(LocalDateTime.now()).append("\n");

        // ── Notify Admin ──────────────────────────────────────────────────────
        StoreMessage adminMsg = new StoreMessage();
        adminMsg.setDriver(driver);
        adminMsg.setOrder(order);
        if (order.getBusiness() != null) adminMsg.setBusiness(order.getBusiness());
        adminMsg.setMessageType(MessageType.DRIVER_REPLY);
        adminMsg.setSubject(subject);
        adminMsg.setContent(body.toString());
        adminMsg.setStatus(MessageStatus.UNREAD);
        adminMsg.setFromAdmin(false);
        messageRepository.save(adminMsg);

        // ── Notify Shop Owner ─────────────────────────────────────────────────
        if (order.getBusiness() != null) {
            StoreMessage shopMsg = new StoreMessage();
            shopMsg.setBusiness(order.getBusiness());
            shopMsg.setDriver(driver);
            shopMsg.setOrder(order);
            shopMsg.setMessageType(MessageType.DRIVER_MESSAGE);
            shopMsg.setSubject(subject);
            shopMsg.setContent(body.toString());
            shopMsg.setStatus(MessageStatus.UNREAD);
            shopMsg.setFromAdmin(true);
            messageRepository.save(shopMsg);
        }
    }

    // ── Driver → Admin + Shop: "I'm on my way" notification ─────────────────

    /**
     * Called when driver accepts an assignment.
     * Sends a notification message to both Admin and the shop owner.
     */
    public void notifyAcceptance(DeliveryAssignment assignment) {
        DeliverDriver driver = assignment.getDriver();
        Order order = assignment.getOrder();
        if (order == null || driver == null) return;

        String driverName = driver.getFirstName() + " " + driver.getLastName();
        String subject = "Driver En Route — Order #" + order.getId();
        StringBuilder content = new StringBuilder();
        content.append("🚗 DRIVER IS ON THE WAY\n\n");
        content.append("Driver ").append(driverName).append(" has accepted the delivery for Order #")
               .append(order.getId()).append(" and is heading to collect the order.\n\n");
        content.append("Driver Details:\n");
        content.append("• Name: ").append(driverName).append("\n");
        content.append("• Vehicle: ").append(driver.getVehicleType()).append("\n");
        content.append("• Contact: ").append(driver.getContactNumber()).append("\n\n");
        if (order.getDeliveryAddress() != null) {
            content.append("Delivery Address: ").append(order.getDeliveryAddress()).append("\n");
        }
        content.append("Order Total: R").append(order.getTotalAmount()).append("\n");

        // Notify admin — store as a driver-reply type so it appears in admin messages
        StoreMessage adminMsg = new StoreMessage();
        adminMsg.setDriver(driver);
        adminMsg.setOrder(order);
        if (order.getBusiness() != null) adminMsg.setBusiness(order.getBusiness());
        adminMsg.setMessageType(MessageType.DRIVER_REPLY);
        adminMsg.setSubject(subject);
        adminMsg.setContent(content.toString());
        adminMsg.setStatus(MessageStatus.UNREAD);
        adminMsg.setFromAdmin(false);
        messageRepository.save(adminMsg);

        // Notify the shop owner — send as a message linked to their business
        if (order.getBusiness() != null) {
            StoreMessage shopMsg = new StoreMessage();
            shopMsg.setBusiness(order.getBusiness());
            shopMsg.setDriver(driver);
            shopMsg.setOrder(order);
            shopMsg.setMessageType(MessageType.DRIVER_MESSAGE);
            shopMsg.setSubject(subject);
            shopMsg.setContent(content.toString());
            shopMsg.setStatus(MessageStatus.UNREAD);
            shopMsg.setFromAdmin(true); // shows up in the shop's inbox
            messageRepository.save(shopMsg);
        }
    }

    // ── Driver → Admin reply ──────────────────────────────────────────────────

    public StoreMessage driverReply(Long messageId, String replyContent) {
        StoreMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found: " + messageId));
        msg.setReplyContent(replyContent);
        msg.setStatus(MessageStatus.REPLIED);
        msg.setRepliedAt(LocalDateTime.now());
        return messageRepository.save(msg);
    }

    // ── Admin → Shop reply ────────────────────────────────────────────────────

    public StoreMessage adminReply(Long messageId, String replyContent) {
        StoreMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found: " + messageId));
        msg.setReplyContent(replyContent);
        msg.setStatus(MessageStatus.REPLIED);
        msg.setRepliedAt(LocalDateTime.now());
        return messageRepository.save(msg);
    }

    public StoreMessage markRead(Long messageId) {
        StoreMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found: " + messageId));
        if (msg.getStatus() == MessageStatus.UNREAD) {
            msg.setStatus(MessageStatus.READ);
            msg.setReadAt(LocalDateTime.now());
        }
        return messageRepository.save(msg);
    }

    public StoreMessage resolve(Long messageId) {
        StoreMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found: " + messageId));
        msg.setStatus(MessageStatus.RESOLVED);
        return messageRepository.save(msg);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public List<StoreMessage> getMessagesForBusiness(Long businessId) {
        return messageRepository.findByBusinessIdOrderBySentAtDesc(businessId);
    }

    public List<StoreMessage> getMessagesForDriver(Long driverId) {
        return messageRepository.findByDriverDeliveryDriverIdOrderBySentAtDesc(driverId);
    }

    public List<StoreMessage> getAllMessages() {
        return messageRepository.findAllByOrderBySentAtDesc();
    }

    public List<StoreMessage> getByStatus(MessageStatus status) {
        return messageRepository.findByStatusOrderBySentAtDesc(status);
    }

    public Optional<StoreMessage> getById(Long id) {
        return messageRepository.findById(id);
    }

    public long countUnread() {
        return messageRepository.countByStatusAndFromAdminFalse(MessageStatus.UNREAD);
    }

    public long countUnreadForDriver(Long driverId) {
        return messageRepository.countByDriverDeliveryDriverIdAndStatusAndFromAdminTrue(
                driverId, MessageStatus.UNREAD);
    }
}
