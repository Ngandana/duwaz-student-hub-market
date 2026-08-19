package org.example.duwaz.classesFolder;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "delivery_drivers")
public class DeliverDriver {

    public enum DriverStatus {
        AVAILABLE, BUSY, OFFLINE, ON_BREAK
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delivery_driver_id")
    private Long deliveryDriverId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "contact_number", nullable = false, unique = true)
    private String contactNumber;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "password")
    private String password;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;

    @Column(name = "license_number", nullable = false, unique = true)
    private String licenseNumber;

    @Column(name = "delivery_count", nullable = false)
    private int deliveryCount = 0;

    @Column(name = "rating")
    private float rating = 0f;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DriverStatus status = DriverStatus.OFFLINE;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @Column(name = "emergency_contact")
    private String emergencyContact;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "last_location_update")
    private java.time.LocalDateTime lastLocationUpdate;

    public DeliverDriver() {}

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getDeliveryDriverId() { return deliveryDriverId; }
    public void setDeliveryDriverId(Long deliveryDriverId) { this.deliveryDriverId = deliveryDriverId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getFullName() { return firstName + " " + lastName; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @JsonIgnore
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public int getDeliveryCount() { return deliveryCount; }
    public void setDeliveryCount(int deliveryCount) { this.deliveryCount = deliveryCount; }

    public float getRating() { return rating; }
    public void setRating(float rating) { this.rating = rating; }

    public DriverStatus getStatus() { return status; }
    public void setStatus(DriverStatus status) { this.status = status; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public java.time.LocalDateTime getLastLocationUpdate() { return lastLocationUpdate; }
    public void setLastLocationUpdate(java.time.LocalDateTime lastLocationUpdate) { this.lastLocationUpdate = lastLocationUpdate; }

    // Legacy setId used by controller
    public void setId(Long id) { this.deliveryDriverId = id; }
}
