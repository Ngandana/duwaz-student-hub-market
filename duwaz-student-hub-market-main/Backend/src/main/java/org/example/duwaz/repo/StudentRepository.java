package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Student findStudentById(Long id);
    Optional<Student> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByStudentNumber(String studentNumber);
}
