package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Review;
import org.example.duwaz.dto.response.DtoMapper;
import org.example.duwaz.dto.response.ReviewDTO;
import org.example.duwaz.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @Autowired
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewDTO> createReview(@RequestBody Review review) {
        return ResponseEntity.status(201).body(DtoMapper.toDto(reviewService.createReview(review)));
    }

    @GetMapping
    public ResponseEntity<List<ReviewDTO>> getAllReviews() {
        return ResponseEntity.ok(DtoMapper.reviewList(reviewService.getAllReviews()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewDTO> getReviewById(@PathVariable Long id) {
        Optional<Review> review = reviewService.getReviewById(id);
        return review.map(r -> ResponseEntity.ok(DtoMapper.toDto(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByProductId(@PathVariable Long productId) {
        return ResponseEntity.ok(DtoMapper.reviewList(reviewService.getReviewsByProductId(productId)));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByStudentId(@PathVariable Long studentId) {
        return ResponseEntity.ok(DtoMapper.reviewList(reviewService.getReviewsByStudentId(studentId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
