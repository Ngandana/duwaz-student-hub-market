package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.dto.AuthRequest;
import org.example.duwaz.dto.AuthResponse;
import org.example.duwaz.dto.RegisterRequest;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:8081", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** Safely get role name — falls back to CUSTOMER if role is NULL in DB */
    private String roleName(Student student) {
        return student.getRole() != null ? student.getRole().name() : "CUSTOMER";
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (studentRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        if (studentRepository.existsByStudentNumber(request.getStudentNumber())) {
            return ResponseEntity.badRequest().body("Student number already registered");
        }

        Student student = new Student();
        student.setStudentName(request.getStudentName());
        student.setStudentNumber(request.getStudentNumber());
        student.setEmail(request.getEmail());
        student.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getLocationAddress() != null && !request.getLocationAddress().isBlank()) {
            student.setLocationAddress(request.getLocationAddress());
        }

        student = studentRepository.save(student);

        String token = jwtUtil.generateToken(student.getEmail(), student.getId(), roleName(student));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, student.getId(), student.getStudentName(), student.getEmail(), roleName(student)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        Student student = studentRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String token = jwtUtil.generateToken(student.getEmail(), student.getId(), roleName(student));

        return ResponseEntity.ok(new AuthResponse(token, student.getId(), student.getStudentName(), student.getEmail(), roleName(student)));
    }
}
