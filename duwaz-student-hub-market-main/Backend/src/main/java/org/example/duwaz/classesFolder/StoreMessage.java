package org.example.duwaz.classesFolder;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "store_messages")
public class StoreMessage {

    public enum MessageType {
        MESSAGE,            // Shop owner → admin general message
        DELIVERY_REQUEST,   // Shop owner → admin structured delivery request
        ADMIN_REPLY,        // Admin → shop owner reply
        DRIVER_MESSAGE,     // Admin → driver (forwarded delivery or instructions)
        DRIVER_REPLY        // Driver → admin reply
    }

    public enum MessageStatus {
        UNREAD, READ, REPLIED, RESOLVED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The business involved (shop owner side) — nullable for driver-only messages */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "business_id")
    @JsonIgnoreProperties({"student", "businesses", "hibernateLazyInitializer", "handler"})
    private Business business;

    /** The driver involved — nullable for shop-only messages */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private DeliverDriver driver;

    /** Optional order reference */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    @JsonIgnoreProperties({"items", "student", "business", "hibernateLazyInitializer", "handler"})
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType = MessageType.MESSAGE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MessageStatus status = MessageStatus.UNREAD;

    @Column(name = "subject")
    private String subject;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    /** Reply content (admin reply to shop, or driver reply to admin) */
    @Column(name = "reply_content", columnDefinition = "TEXT")
    private String replyContent;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    /** true = message originated from admin side */
    @Column(name = "from_admin", nullable = false)
    private boolean fromAdmin = false;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) sentAt = LocalDateTime.now();
    }

    public StoreMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }

    public DeliverDriver getDriver() { return driver; }
    public void setDriver(DeliverDriver driver) { this.driver = driver; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public MessageType getMessageType() { return messageType; }
    public void setMessageType(MessageType messageType) { this.messageType = messageType; }

    public MessageStatus getStatus() { return status; }
    public void setStatus(MessageStatus status) { this.status = status; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getReplyContent() { return replyContent; }
    public void setReplyContent(String replyContent) { this.replyContent = replyContent; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    public LocalDateTime getRepliedAt() { return repliedAt; }
    public void setRepliedAt(LocalDateTime repliedAt) { this.repliedAt = repliedAt; }

    public boolean isFromAdmin() { return fromAdmin; }
    public void setFromAdmin(boolean fromAdmin) { this.fromAdmin = fromAdmin; }
}
