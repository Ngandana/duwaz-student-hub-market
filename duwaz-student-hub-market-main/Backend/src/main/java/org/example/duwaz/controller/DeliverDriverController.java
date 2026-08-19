package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.service.DeliverDriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/delivery-drivers")
@CrossOrigin(origins = "*")
public class DeliverDriverController {

    private final DeliverDriverService deliverDriverService;

    @Autowired
    public DeliverDriverController(DeliverDriverService deliverDriverService) {
        this.deliverDriverService = deliverDriverService;
    }

    @PostMapping
    public ResponseEntity<DeliverDriver> createDriver(@RequestBody DeliverDriver deliverDriver) {
        return ResponseEntity.status(201).body(deliverDriverService.createDeliverDriver(deliverDriver));
    }

    @GetMapping
    public ResponseEntity<List<DeliverDriver>> getAllDrivers() {
        return ResponseEntity.ok(deliverDriverService.getAllDeliverDrivers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliverDriver> getDriverById(@PathVariable Long id) {
        Optional<DeliverDriver> driver = deliverDriverService.getDeliverDriverById(id);
        return driver.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<DeliverDriver> getDriverByEmail(@PathVariable String email) {
        Optional<DeliverDriver> driver = deliverDriverService.getDeliverDriverByEmail(email);
        return driver.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/contact/{contactNumber}")
    public ResponseEntity<DeliverDriver> getDriverByContact(@PathVariable String contactNumber) {
        Optional<DeliverDriver> driver = deliverDriverService.getDeliverDriverByContactNumber(contactNumber);
        return driver.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliverDriver> updateDriver(@PathVariable Long id, @RequestBody DeliverDriver updatedDriver) {
        Optional<DeliverDriver> existing = deliverDriverService.getDeliverDriverById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        updatedDriver.setId(id); // Ensure the ID is set for update
        return ResponseEntity.ok(deliverDriverService.updateDeliverDriver(updatedDriver));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        deliverDriverService.deleteDeliverDriver(id);
        return ResponseEntity.noContent().build();
    }
}

