package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.classesFolder.Product;
import org.example.duwaz.classesFolder.Product.ProductStatus;
import org.example.duwaz.repo.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product createProduct(Product product) {
        // Auto-set status based on initial stock
        if (product.getStockQuantity() <= 0) {
            product.setProductStatus(ProductStatus.OUT_OF_STOCK);
        }
        return productRepository.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByBusiness(Long businessId) {
        return productRepository.findByBusinessId(businessId);
    }

    public List<Product> getProductsByBusinessAndStatus(Long businessId, ProductStatus status) {
        return productRepository.findByBusinessIdAndProductStatus(businessId, status);
    }

    public List<Product> getLowStockProducts(Long businessId, int threshold) {
        return productRepository.findByBusinessIdAndStockQuantityLessThanEqual(businessId, threshold);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id " + id));
    }

    public Product updateProduct(Long id, Product product) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id " + id));
        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setPrice(product.getPrice());
        existing.setCategory(product.getCategory());
        existing.setBusiness(product.getBusiness());
        existing.setStockQuantity(product.getStockQuantity());
        if (product.getProductStatus() != null) {
            existing.setProductStatus(product.getProductStatus());
        }
        if (product.getImageUrl() != null) {
            existing.setImageUrl(product.getImageUrl());
        }
        return productRepository.save(existing);
    }

    /** Adjust stock by a delta (positive = add, negative = reduce) */
    public Product adjustStock(Long id, int delta) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id " + id));
        int newStock = product.getStockQuantity() + delta;
        if (newStock < 0) throw new RuntimeException("Insufficient stock");
        product.setStockQuantity(newStock);
        return productRepository.save(product);
    }

    /** Decrease stock when an order is completed — called from OrderService */
    public void decrementStockForOrder(Long productId, int quantity) {
        productRepository.findById(productId).ifPresent(product -> {
            int newStock = Math.max(0, product.getStockQuantity() - quantity);
            product.setStockQuantity(newStock);
            productRepository.save(product);
        });
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    /** Verify a product belongs to a given business */
    public boolean isOwnedByBusiness(Long productId, Business business) {
        return productRepository.findById(productId)
                .map(p -> p.getBusiness() != null && p.getBusiness().getId().equals(business.getId()))
                .orElse(false);
    }

    // Stats helpers
    public long countByBusiness(Long businessId) {
        return productRepository.countByBusinessId(businessId);
    }

    public long countByBusinessAndStatus(Long businessId, ProductStatus status) {
        return productRepository.countByBusinessIdAndProductStatus(businessId, status);
    }

    public java.math.BigDecimal revenueByBusiness(Long businessId) {
        java.math.BigDecimal rev = productRepository.sumRevenueByBusinessId(businessId);
        return rev != null ? rev : java.math.BigDecimal.ZERO;
    }
}
