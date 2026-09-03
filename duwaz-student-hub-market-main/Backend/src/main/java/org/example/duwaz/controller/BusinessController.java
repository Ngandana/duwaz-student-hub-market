package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.dto.response.BusinessDTO;
import org.example.duwaz.dto.response.DtoMapper;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.BusinessService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection")
@RestController
@RequestMapping("/api/businesses")
public class BusinessController {

    private final BusinessService businessService;
    private final StudentRepository studentRepository;

    public BusinessController(BusinessService businessService, StudentRepository studentRepository) {
        this.businessService = businessService;
        this.studentRepository = studentRepository;
    }

    // ── Public endpoints ──────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<BusinessDTO>> getAllBusinesses() {
        return ResponseEntity.ok(DtoMapper.businessList(businessService.getAllBusiness()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessDTO> getBusinessById(@PathVariable Long id) {
        Business business = businessService.findBusinessById(id);
        return ResponseEntity.ok(DtoMapper.toDto(business));
    }

    // ── Authenticated endpoints ───────────────────────────────────────────────

    /**
     * Returns ALL businesses owned by the currently authenticated student.
     * Returns empty list if they have none.
     */
    @GetMapping("/mine/all")
    public ResponseEntity<List<BusinessDTO>> getMyShops(Authentication auth) {
        String email = auth.getName();
        return studentRepository.findByEmail(email)
                .map(student -> ResponseEntity.ok(DtoMapper.businessList(businessService.findAllByStudentId(student.getId()))))
                .orElse(ResponseEntity.ok(List.of()));
    }

    /**
     * Returns the FIRST business owned by the currently authenticated student.
     * Returns 404 if the student doesn't own a shop yet.
     */
    @GetMapping("/mine")
    public ResponseEntity<BusinessDTO> getMyShop(Authentication auth) {
        String email = auth.getName();
        return studentRepository.findByEmail(email)
                .flatMap(student -> businessService.findByStudentId(student.getId()))
                .map(b -> ResponseEntity.ok(DtoMapper.toDto(b)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BusinessDTO> createBusiness(@RequestBody Business business,
                                                    Authentication auth) {
        // Attach the authenticated student as owner
        String email = auth.getName();
        studentRepository.findByEmail(email).ifPresent(business::setStudent);
        Business created = businessService.saveBusiness(business);
        return new ResponseEntity<>(DtoMapper.toDto(created), HttpStatus.CREATED);
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

        return ResponseEntity.ok(DtoMapper.toDto(businessService.updateBusiness(id, business)));
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
