package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.repo.BusinessRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BusinessService {

    private final BusinessRepository businessRepository;

    public BusinessService(BusinessRepository businessRepository) {
        this.businessRepository = businessRepository;
    }

    public Business saveBusiness(Business business) {
        return businessRepository.save(business);
    }

    public Business findBusinessById(Long id) {
        return businessRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Business not found with id " + id));
    }

    public Optional<Business> findByStudentId(Long studentId) {
        return businessRepository.findByStudentId(studentId);
    }

    public List<Business> findAllByStudentId(Long studentId) {
        return businessRepository.findAllByStudentId(studentId);
    }

    public List<Business> getAllBusiness() {
        return businessRepository.findAll();
    }

    public Business updateBusiness(Long id, Business updated) {
        Business existing = businessRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Business not found with id " + id));
        existing.setBusinessName(updated.getBusinessName());
        existing.setDescription(updated.getDescription());
        if (updated.getLogoUrl() != null) {
            existing.setLogoUrl(updated.getLogoUrl());
        }
        return businessRepository.save(existing);
    }

    public boolean deleteBusinessById(Long id) {
        businessRepository.deleteById(id);
        return !businessRepository.existsById(id);
    }
}
