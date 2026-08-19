package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.classesFolder.Order.OrderStatus;
import org.example.duwaz.classesFolder.Product.ProductStatus;
import org.example.duwaz.repo.BusinessRepository;
import org.example.duwaz.service.OrderService;
import org.example.duwaz.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/shops")
@CrossOrigin(origins = "*")
public class ShopStatsController {

    private final BusinessRepository businessRepository;
    private final ProductService productService;
    private final OrderService orderService;

    public ShopStatsController(BusinessRepository businessRepository,
                                ProductService productService,
                                OrderService orderService) {
        this.businessRepository = businessRepository;
        this.productService = productService;
        this.orderService = orderService;
    }

    /**
     * GET /api/shops/stats
     * Returns KPI summary for the currently authenticated shop owner.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getShopStats(Authentication auth) {
        Optional<Business> bizOpt = businessRepository.findFirstByStudentEmail(auth.getName());
        if (bizOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("You don't own a shop");
        }
        Long bizId = bizOpt.get().getId();

        Map<String, Object> stats = new HashMap<>();

        // Product stats
        stats.put("totalProducts", productService.countByBusiness(bizId));
        stats.put("availableProducts", productService.countByBusinessAndStatus(bizId, ProductStatus.AVAILABLE));
        stats.put("outOfStockProducts", productService.countByBusinessAndStatus(bizId, ProductStatus.OUT_OF_STOCK));
        stats.put("discontinuedProducts", productService.countByBusinessAndStatus(bizId, ProductStatus.DISCONTINUED));
        stats.put("lowStockProducts", (long) productService.getLowStockProducts(bizId, 5).size());

        // Order stats
        stats.put("pendingOrders", orderService.countByBusinessAndStatus(bizId, OrderStatus.PENDING));
        stats.put("confirmedOrders", orderService.countByBusinessAndStatus(bizId, OrderStatus.CONFIRMED));
        stats.put("preparingOrders", orderService.countByBusinessAndStatus(bizId, OrderStatus.PREPARING));
        stats.put("completedOrders", orderService.countByBusinessAndStatus(bizId, OrderStatus.DELIVERED));
        stats.put("cancelledOrders", orderService.countByBusinessAndStatus(bizId, OrderStatus.CANCELLED));
        stats.put("totalOrders", orderService.countByBusiness(bizId));

        // Revenue
        stats.put("totalRevenue", productService.revenueByBusiness(bizId));

        return ResponseEntity.ok(stats);
    }
}
