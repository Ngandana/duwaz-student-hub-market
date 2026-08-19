package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessRepository extends JpaRepository<Business, Long> {
    Business findBusinessById(Long id);
    Optional<Business> findByStudentId(Long studentId);
    Optional<Business> findFirstByStudentEmail(String email);
    List<Business> findAllByStudentEmail(String email);
    List<Business> findAllByStudentId(Long studentId);
}
