package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.classesFolder.Product;
import org.example.duwaz.classesFolder.Product.ProductStatus;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.repo.BusinessRepository;
import org.example.duwaz.repo.StudentRepository;
import org.example.duwaz.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;
    private final BusinessRepository businessRepository;
    private final StudentRepository studentRepository;

    public ProductController(ProductService productService,
                              BusinessRepository businessRepository,
                              StudentRepository studentRepository) {
        this.productService = productService;
        this.businessRepository = businessRepository;
        this.studentRepository = studentRepository;
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private Optional<Business> getOwnerBusiness(Authentication auth) {
        if (auth == null) return Optional.empty();
        return businessRepository.findFirstByStudentEmail(auth.getName());
    }

    // ── Public endpoints ──────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/business/{businessId}")
    public ResponseEntity<List<Product>> getProductsByBusiness(@PathVariable Long businessId) {
        return ResponseEntity.ok(productService.getProductsByBusiness(businessId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // ── Shop owner endpoints ──────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product, Authentication auth) {
        Optional<Business> biz = getOwnerBusiness(auth);
        // Allow admin to create products for any business; shop owners only for their own
        Student requester = auth != null ? studentRepository.findByEmail(auth.getName()).orElse(null) : null;
        boolean isAdmin = requester != null && requester.isAdmin();

        if (!isAdmin) {
            if (biz.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't own a shop");
            }
            // Force product to belong to the owner's business
            product.setBusiness(biz.get());
        }
        return ResponseEntity.status(201).body(productService.createProduct(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id,
                                            @RequestBody Product product,
                                            Authentication auth) {
        Optional<Business> biz = getOwnerBusiness(auth);
        Student requester = auth != null ? studentRepository.findByEmail(auth.getName()).orElse(null) : null;
        boolean isAdmin = requester != null && requester.isAdmin();

        if (!isAdmin) {
            if (biz.isEmpty() || !productService.isOwnedByBusiness(id, biz.get())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't own this product");
            }
        }
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id, Authentication auth) {
        Optional<Business> biz = getOwnerBusiness(auth);
        Student requester = auth != null ? studentRepository.findByEmail(auth.getName()).orElse(null) : null;
        boolean isAdmin = requester != null && requester.isAdmin();

        if (!isAdmin) {
            if (biz.isEmpty() || !productService.isOwnedByBusiness(id, biz.get())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't own this product");
            }
        }
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    /** Adjust stock: body = { "delta": 5 } to add, { "delta": -3 } to reduce */
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> adjustStock(@PathVariable Long id,
                                          @RequestBody Map<String, Integer> body,
                                          Authentication auth) {
        Optional<Business> biz = getOwnerBusiness(auth);
        Student requester = auth != null ? studentRepository.findByEmail(auth.getName()).orElse(null) : null;
        boolean isAdmin = requester != null && requester.isAdmin();

        if (!isAdmin && (biz.isEmpty() || !productService.isOwnedByBusiness(id, biz.get()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't own this product");
        }

        Integer delta = body.get("delta");
        if (delta == null) return ResponseEntity.badRequest().body("delta is required");
        try {
            return ResponseEntity.ok(productService.adjustStock(id, delta));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
