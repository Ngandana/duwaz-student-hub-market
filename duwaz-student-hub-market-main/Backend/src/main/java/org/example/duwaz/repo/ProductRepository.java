package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.Product;
import org.example.duwaz.classesFolder.Product.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Product findByName(String name);
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByBusinessId(Long businessId);
    List<Product> findByBusinessIdAndProductStatus(Long businessId, ProductStatus status);
    List<Product> findByBusinessIdAndStockQuantityLessThanEqual(Long businessId, int threshold);
    List<Product> findByNameContainingIgnoreCase(String name);
    boolean existsByName(String name);

    long countByBusinessId(Long businessId);
    long countByBusinessIdAndProductStatus(Long businessId, ProductStatus status);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.business.id = :businessId AND o.status = 'DELIVERED'")
    java.math.BigDecimal sumRevenueByBusinessId(Long businessId);
}
