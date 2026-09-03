package org.example.duwaz.dto.response;

import org.example.duwaz.classesFolder.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Every controller maps its JPA entities through here before they leave the app.
 *
 * Previously controllers returned entities straight from the repository, relying on
 * a scattered mix of @JsonIgnore / @JsonIgnoreProperties annotations on the entities
 * themselves to keep sensitive fields (passwords) and awkward relations out of the
 * response. That's fragile — it's easy to add a new entity field and forget the
 * annotation, and it ties the wire format 1:1 to the database schema. These DTOs are
 * a deliberate, explicit contract instead: whatever's listed in the record is what
 * goes out, nothing more.
 *
 * One simplification versus the old per-relation @JsonIgnoreProperties lists: those
 * varied by nesting depth (e.g. Order.business used to hide its owning student, but
 * a top-level GET /api/businesses/{id} showed it). None of that variation was a real
 * security boundary — the only thing that ever needed hiding was the password, and
 * StudentDTO/DriverDTO never have one, anywhere. So every nested reference here uses
 * the same full shape consistently, which is easier to reason about and to keep
 * correct going forward.
 */
public class DtoMapper {

    private DtoMapper() {}

    public static StudentDTO toDto(Student s) {
        if (s == null) return null;
        return new StudentDTO(
                s.getId(),
                s.getStudentName(),
                s.getStudentNumber(),
                s.getEmail(),
                s.getRole() != null ? s.getRole().name() : null,
                s.getLocationAddress(),
                s.getProfileImage()
        );
    }

    public static BusinessDTO toDto(Business b) {
        if (b == null) return null;
        return new BusinessDTO(
                b.getId(),
                b.getBusinessName(),
                b.getDescription(),
                b.getLogoUrl(),
                b.getShopCategory(),
                b.getPhoneNumber(),
                b.getOperatingHours(),
                toDto(b.getStudent())
        );
    }

    public static CategoryDTO toDto(Category c) {
        if (c == null) return null;
        return new CategoryDTO(c.getId(), c.getName(), c.getDescription());
    }

    public static ProductDTO toDto(Product p) {
        if (p == null) return null;
        return new ProductDTO(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getImageUrl(),
                p.getStockQuantity(),
                p.getProductStatus() != null ? p.getProductStatus().name() : null,
                toDto(p.getCategory()),
                toDto(p.getBusiness())
        );
    }

    public static OrderItemDTO toDto(OrderItem i) {
        if (i == null) return null;
        return new OrderItemDTO(i.getId(), toDto(i.getProduct()), i.getQuantity(), i.getUnitPrice(), i.getSubtotal());
    }

    public static OrderDTO toDto(Order o) {
        if (o == null) return null;
        List<OrderItemDTO> items = o.getItems() == null
                ? List.of()
                : o.getItems().stream().map(DtoMapper::toDto).collect(Collectors.toList());
        return new OrderDTO(
                o.getId(),
                toDto(o.getStudent()),
                toDto(o.getBusiness()),
                items,
                o.getTotalAmount(),
                o.getDeliveryFee(),
                o.getPointsRedeemed(),
                o.getOrderDate(),
                o.getStatus() != null ? o.getStatus().name() : null,
                o.getDeliveryAddress(),
                o.getCancellationReason()
        );
    }

    public static DriverDTO toDto(DeliverDriver d) {
        if (d == null) return null;
        return new DriverDTO(
                d.getDeliveryDriverId(),
                d.getFirstName(),
                d.getLastName(),
                d.getContactNumber(),
                d.getEmail(),
                d.getVehicleType(),
                d.getLicenseNumber(),
                d.getDeliveryCount(),
                d.getRating(),
                d.getStatus() != null ? d.getStatus().name() : null,
                d.isActive(),
                d.getProfileImage(),
                d.getEmergencyContact(),
                d.getLatitude(),
                d.getLongitude(),
                d.getLastLocationUpdate()
        );
    }

    public static DeliveryAssignmentDTO toDto(DeliveryAssignment a) {
        if (a == null) return null;
        return new DeliveryAssignmentDTO(
                a.getId(),
                toDto(a.getOrder()),
                toDto(a.getDriver()),
                a.getDeliveryStatus() != null ? a.getDeliveryStatus().name() : null,
                a.getAssignedAt(),
                a.getAcceptedAt(),
                a.getPickedUpAt(),
                a.getDeliveredAt(),
                a.getDeliveryNotes(),
                a.getFailureReason(),
                a.getProofOfDelivery(),
                a.getOtpCode(),
                a.isOtpVerified()
        );
    }

    public static StoreMessageDTO toDto(StoreMessage m) {
        if (m == null) return null;
        return new StoreMessageDTO(
                m.getId(),
                toDto(m.getBusiness()),
                toDto(m.getDriver()),
                toDto(m.getOrder()),
                m.getMessageType() != null ? m.getMessageType().name() : null,
                m.getStatus() != null ? m.getStatus().name() : null,
                m.getSubject(),
                m.getContent(),
                m.getReplyContent(),
                m.getSentAt(),
                m.getReadAt(),
                m.getRepliedAt(),
                m.isFromAdmin()
        );
    }

    public static ReviewDTO toDto(Review r) {
        if (r == null) return null;
        return new ReviewDTO(r.getId(), r.getStudentId(), r.getProductId(), r.getRating(), r.getComment(), r.getReviewDate());
    }

    public static RewardDTO toDto(Rewards r) {
        if (r == null) return null;
        return new RewardDTO(r.getId(), r.getName(), r.getDescription(), r.getPoints());
    }

    public static TransactionDTO toDto(Transaction t) {
        if (t == null) return null;
        return new TransactionDTO(
                t.getId(),
                toDto(t.getStudent()),
                toDto(t.getProduct()),
                toDto(t.getOrder()),
                t.getAmount(),
                t.getTransactionDate(),
                t.getStatus() != null ? t.getStatus().name() : null
        );
    }

    public static StudentRewardDTO toDto(StudentReward sr) {
        if (sr == null) return null;
        return new StudentRewardDTO(
                sr.getId(), toDto(sr.getStudent()), toDto(sr.getOrder()),
                sr.getPointsEarned(), sr.getOrderAmount(), sr.getEarnedAt(), sr.getDescription()
        );
    }

    public static DriverEarningDTO toDto(DriverEarning de) {
        if (de == null) return null;
        return new DriverEarningDTO(
                de.getId(), toDto(de.getDriver()), toDto(de.getOrder()),
                de.getAmount(), de.getOrderTotal(), de.getEarnedAt(), de.getDescription()
        );
    }

    // ── List / Page helpers ──────────────────────────────────────────────────

    public static List<StudentDTO> studentList(List<Student> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<BusinessDTO> businessList(List<Business> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<CategoryDTO> categoryList(List<Category> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<ProductDTO> productList(List<Product> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<OrderDTO> orderList(List<Order> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<DriverDTO> driverList(List<DeliverDriver> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<DeliveryAssignmentDTO> assignmentList(List<DeliveryAssignment> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<StoreMessageDTO> messageList(List<StoreMessage> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<ReviewDTO> reviewList(List<Review> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<RewardDTO> rewardList(List<Rewards> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<TransactionDTO> transactionList(List<Transaction> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<StudentRewardDTO> studentRewardList(List<StudentReward> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }
    public static List<DriverEarningDTO> driverEarningList(List<DriverEarning> l) { return l.stream().map(DtoMapper::toDto).collect(Collectors.toList()); }

    public static Page<OrderDTO> orderPage(Page<Order> page) { return page.map(DtoMapper::toDto); }
}
