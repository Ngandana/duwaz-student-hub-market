package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.dto.response.DtoMapper;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Legacy-named ("/Student" instead of "/api/students") profile CRUD, kept at its
 * original path since the frontend already depends on it (see AuthContext + api.ts).
 *
 * IMPORTANT: every method here is now scoped to "the caller themselves, or an admin".
 * Previously these had no ownership check at all — any authenticated user could read,
 * edit, or delete *any other* student's account by id. Account creation is handled by
 * POST /api/auth/register (which hashes the password); this class no longer exposes a
 * duplicate, unhashed-password /create endpoint.
 */
@RestController
@RequestMapping("/Student")
public class StudentController {

    @Autowired
    private StudentService service;

    @Autowired
    private StudentRepository studentRepository;

    private Student requireSelfOrAdmin(Authentication auth, long targetId) {
        if (auth == null) return null;
        Student requester = studentRepository.findByEmail(auth.getName()).orElse(null);
        if (requester == null) return null;
        if (requester.isAdmin() || requester.getId().equals(targetId)) {
            return requester;
        }
        return null;
    }

    @GetMapping("/read/{studentId}")
    public ResponseEntity<?> read(@PathVariable long studentId, Authentication auth) {
        if (requireSelfOrAdmin(auth, studentId) == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return ResponseEntity.ok(DtoMapper.toDto(service.findStudentById(studentId)));
    }

    @PutMapping("/update")
    public ResponseEntity<?> update(@RequestBody Student student, Authentication auth) {
        if (student.getId() == null || requireSelfOrAdmin(auth, student.getId()) == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return ResponseEntity.ok(DtoMapper.toDto(service.updateStudent(student)));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> delete(@PathVariable long id, Authentication auth) {
        if (requireSelfOrAdmin(auth, id) == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        service.deleteStudentById(id);
        return ResponseEntity.noContent().build();
    }

    /** Admin-only — regular users get the same data (minus PII of others) via /api/businesses etc. */
    @GetMapping("/getall")
    public ResponseEntity<?> getallStudent(Authentication auth) {
        Student requester = auth != null ? studentRepository.findByEmail(auth.getName()).orElse(null) : null;
        if (requester == null || !requester.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin access required");
        }
        return ResponseEntity.ok(DtoMapper.studentList(service.getAllStudents()));
    }
}
