package org.example.duwaz.classesFolder;

import jakarta.persistence.Id;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Getter
@Setter
public class Business {

    public Business() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "description")
    private String description;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    /** Shop category e.g. "Food & Drinks", "Clothing", "Electronics" */
    @Column(name = "shop_category")
    private String shopCategory;

    /** Owner / contact phone number */
    @Column(name = "phone_number")
    private String phoneNumber;

    /** Free-text operating hours e.g. "Mon–Fri 08:00–17:00, Sat 09:00–13:00" */
    @Column(name = "operating_hours")
    private String operatingHours;

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "student_id")
    @JsonIgnoreProperties({"businesses", "password", "hibernateLazyInitializer", "handler"})
    private Student student;

    public void setName(String doas) {
        this.businessName = doas;
    }
}