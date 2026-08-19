package org.example.duwaz.classesFolder;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
public class Student {

    public enum Role {
        CUSTOMER, ADMIN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Getter
    @Setter
    @Column(nullable = false)
    private String studentName;

    @Getter
    @Setter
    @Column(unique = true, nullable = false)
    private String studentNumber;

    @Getter
    @Setter
    @Column(unique = true, nullable = false)
    private String email;

    @Getter
    @Setter
    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Getter
    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CUSTOMER;

    @Getter
    @Setter
    @Column(name = "location_address")
    private String locationAddress;

    @Getter
    @Setter
    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @JsonIgnore
    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
    private List<Business> businesses;

    public void setName(String name) {
        this.studentName = name;
    }

    public String getName() {
        return this.studentName;
    }

    public Student setId(long l) {
        this.id = l;
        return this;
    }

    public boolean isAdmin() {
        return Role.ADMIN.equals(this.role);
    }
}
