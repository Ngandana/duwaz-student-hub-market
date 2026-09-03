package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.exception.BadRequestException;
import org.example.duwaz.exception.NotFoundException;
import org.example.duwaz.repo.StudentRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }

    public Student findStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Student not found with id " + id));
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student updateStudent(Student student) {
        // Load existing record so we never overwrite password, email, or role
        Student existing = studentRepository.findById(student.getId())
                .orElseThrow(() -> new RuntimeException("Student not found with id " + student.getId()));

        // Only update safe profile fields
        if (student.getStudentName() != null) existing.setStudentName(student.getStudentName());
        if (student.getStudentNumber() != null) existing.setStudentNumber(student.getStudentNumber());
        if (student.getLocationAddress() != null) existing.setLocationAddress(student.getLocationAddress());
        // Allow clearing profileImage by passing empty string, or setting a new one
        if (student.getProfileImage() != null) {
            existing.setProfileImage(student.getProfileImage().isEmpty() ? null : student.getProfileImage());
        }

        return studentRepository.save(existing);
    }

    public void deleteStudentById(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new NotFoundException("Student not found with id " + id);
        }
        try {
            studentRepository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            // The account has orders, a shop, reviews, etc. referencing it — deleting
            // outright would either crash (as it did before this check existed) or,
            // if cascaded, silently destroy order/financial history. Neither is right
            // for a self-service delete, so surface a clear reason instead.
            throw new BadRequestException(
                    "Cannot delete this account: it still has orders, a shop, or other "
                    + "records attached. Contact support if you need it removed.");
        }
    }
}
