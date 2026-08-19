package org.example.duwaz.service;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.repo.DeliverDriverRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DeliverDriverService {
    private final DeliverDriverRepository deliverDriverRepository;

    public DeliverDriverService(DeliverDriverRepository deliverDriverRepository) {
        this.deliverDriverRepository = deliverDriverRepository;
    }

    public DeliverDriver createDeliverDriver(DeliverDriver deliverDriver) {
        return deliverDriverRepository.save(deliverDriver);
    }

    public List<DeliverDriver> getAllDeliverDrivers() {
        return deliverDriverRepository.findAll();
    }

    public Optional<DeliverDriver> getDeliverDriverById(Long id) {
        return deliverDriverRepository.findById(id);
    }

    public Optional<DeliverDriver> getDeliverDriverByEmail(String email) {
        return deliverDriverRepository.findByEmail(email);
    }

    public Optional<DeliverDriver> getDeliverDriverByContactNumber(String contactNumber) {
        return deliverDriverRepository.findByContactNumber(contactNumber);
    }

    public DeliverDriver updateDeliverDriver(DeliverDriver deliverDriver) {
        return deliverDriverRepository.save(deliverDriver);
    }

    public void deleteDeliverDriver(Long id) {
        deliverDriverRepository.deleteById(id);
    }
}