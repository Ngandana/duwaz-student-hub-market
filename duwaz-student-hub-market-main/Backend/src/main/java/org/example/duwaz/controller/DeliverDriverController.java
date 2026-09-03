package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.dto.response.DriverDTO;
import org.example.duwaz.dto.response.DtoMapper;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.DeliverDriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Legacy driver CRUD — unused by the frontend (which manages drivers through
 * /api/deliveries/* instead: self-service profile updates, admin assign/forward).
 *
 * Previously every mutation here (create/update/delete) had no ownership or admin
 * check at all — any authenticated user, student or driver, could create a driver
 * record with a plaintext password (bypassing the hashing that /api/auth/driver/register
 * does), or overwrite/delete any existing driver's profile. Locked down to admin-only
 * for mutations now, matching how the rest of the app treats driver management.
 */
@RestController
@RequestMapping("/api/delivery-drivers")
public class DeliverDriverController {

    private final DeliverDriverService deliverDriverService;
    private final StudentRepository studentRepository;

    @Autowired
    public DeliverDriverController(DeliverDriverService deliverDriverService,
                                    StudentRepository studentRepository) {
        this.deliverDriverService = deliverDriverService;
        this.studentRepository = studentRepository;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        Student s = studentRepository.findByEmail(auth.getName()).orElse(null);
        return s != null && s.isAdmin();
    }

    @PostMapping
    public ResponseEntity<?> createDriver(@RequestBody DeliverDriver deliverDriver, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        return ResponseEntity.status(201).body(DtoMapper.toDto(deliverDriverService.createDeliverDriver(deliverDriver)));
    }

    @GetMapping
    public ResponseEntity<List<DriverDTO>> getAllDrivers() {
        return ResponseEntity.ok(DtoMapper.driverList(deliverDriverService.getAllDeliverDrivers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverDTO> getDriverById(@PathVariable Long id) {
        Optional<DeliverDriver> driver = deliverDriverService.getDeliverDriverById(id);
        return driver.map(d -> ResponseEntity.ok(DtoMapper.toDto(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<DriverDTO> getDriverByEmail(@PathVariable String email) {
        Optional<DeliverDriver> driver = deliverDriverService.getDeliverDriverByEmail(email);
        return driver.map(d -> ResponseEntity.ok(DtoMapper.toDto(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/contact/{contactNumber}")
    public ResponseEntity<DriverDTO> getDriverByContact(@PathVariable String contactNumber) {
        Optional<DeliverDriver> driver = deliverDriverService.getDeliverDriverByContactNumber(contactNumber);
        return driver.map(d -> ResponseEntity.ok(DtoMapper.toDto(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDriver(@PathVariable Long id, @RequestBody DeliverDriver updatedDriver, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        Optional<DeliverDriver> existing = deliverDriverService.getDeliverDriverById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        updatedDriver.setId(id); // Ensure the ID is set for update
        return ResponseEntity.ok(DtoMapper.toDto(deliverDriverService.updateDeliverDriver(updatedDriver)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDriver(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin only");
        deliverDriverService.deleteDeliverDriver(id);
        return ResponseEntity.noContent().build();
    }
}
