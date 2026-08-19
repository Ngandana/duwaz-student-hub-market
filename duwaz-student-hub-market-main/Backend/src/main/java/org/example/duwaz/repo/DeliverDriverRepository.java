package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.classesFolder.DeliverDriver.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface DeliverDriverRepository extends JpaRepository<DeliverDriver, Long> {

    Optional<DeliverDriver> findByEmail(String email);
    Optional<DeliverDriver> findByContactNumber(String phoneNumber);
    List<DeliverDriver> findByVehicleType(String vehicleType);
    List<DeliverDriver> findByStatus(DriverStatus status);
    List<DeliverDriver> findByActiveTrue();
    List<DeliverDriver> findByStatusAndActiveTrue(DriverStatus status);
    List<DeliverDriver> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName);

    boolean existsByEmail(String email);
    boolean existsByContactNumber(String phoneNumber);
    boolean existsByLicenseNumber(String licenseNumber);
}
