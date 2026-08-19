package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.BusinessService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection")
@RestController
@RequestMapping("/api/businesses")
@CrossOrigin(origins = "*")
public class BusinessController {

    private final BusinessService businessService;
    private final StudentRepository studentRepository;

    public BusinessController(BusinessService businessService, StudentRepository studentRepository) {
        this.businessService = businessService;
        this.studentRepository = studentRepository;
    }

    // ── Public endpoints ──────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Business>> getAllBusinesses() {
        return ResponseEntity.ok(businessService.getAllBusiness());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Business> getBusinessById(@PathVariable Long id) {
        Business business = businessService.findBusinessById(id);
        return ResponseEntity.ok(business);
    }

    // ── Authenticated endpoints ───────────────────────────────────────────────

    /**
     * Returns ALL businesses owned by the currently authenticated student.
     * Returns empty list if they have none.
     */
    @GetMapping("/mine/all")
    public ResponseEntity<List<Business>> getMyShops(Authentication auth) {
        String email = auth.getName();
        return studentRepository.findByEmail(email)
                .map(student -> ResponseEntity.ok(businessService.findAllByStudentId(student.getId())))
                .orElse(ResponseEntity.ok(List.of()));
    }

    /**
     * Returns the FIRST business owned by the currently authenticated student.
     * Returns 404 if the student doesn't own a shop yet.
     */
    @GetMapping("/mine")
    public ResponseEntity<Business> getMyShop(Authentication auth) {
        String email = auth.getName();
        return studentRepository.findByEmail(email)
                .flatMap(student -> businessService.findByStudentId(student.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Business> createBusiness(@RequestBody Business business,
                                                    Authentication auth) {
        // Attach the authenticated student as owner
        String email = auth.getName();
        studentRepository.findByEmail(email).ifPresent(business::setStudent);
        Business created = businessService.saveBusiness(business);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBusiness(@PathVariable Long id,
                                             @RequestBody Business business,
                                             Authentication auth) {
        String email = auth.getName();
        Business existing = businessService.findBusinessById(id);

        // Only the owner can update
        if (existing.getStudent() == null ||
            !existing.getStudent().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not the owner of this shop");
        }

        return ResponseEntity.ok(businessService.updateBusiness(id, business));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBusiness(@PathVariable Long id, Authentication auth) {
        String email = auth.getName();
        Business existing = businessService.findBusinessById(id);

        if (existing.getStudent() == null ||
            !existing.getStudent().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not the owner of this shop");
        }

        businessService.deleteBusinessById(id);
        return ResponseEntity.noContent().build();
    }
}
