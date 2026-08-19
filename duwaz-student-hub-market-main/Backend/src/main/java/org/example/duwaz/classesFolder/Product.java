package org.example.duwaz.classesFolder;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@Entity
public class Product {

    public enum ProductStatus {
        AVAILABLE, OUT_OF_STOCK, DISCONTINUED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_status", nullable = false)
    private ProductStatus productStatus = ProductStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "business_id")
    @JsonIgnoreProperties({"student", "businesses", "hibernateLazyInitializer", "handler"})
    private Business business;

    public Product() {}

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
        // Auto-update status based on stock
        if (stockQuantity <= 0 && this.productStatus == ProductStatus.AVAILABLE) {
            this.productStatus = ProductStatus.OUT_OF_STOCK;
        } else if (stockQuantity > 0 && this.productStatus == ProductStatus.OUT_OF_STOCK) {
            this.productStatus = ProductStatus.AVAILABLE;
        }
    }

    public ProductStatus getProductStatus() { return productStatus; }
    public void setProductStatus(ProductStatus productStatus) { this.productStatus = productStatus; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }

    @Override
    public String toString() {
        return "Product{id=" + id + ", name='" + name + "', price=" + price + ", stock=" + stockQuantity + "}";
    }
}
