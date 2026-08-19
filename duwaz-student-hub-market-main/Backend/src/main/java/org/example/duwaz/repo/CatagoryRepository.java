package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CatagoryRepository extends JpaRepository<Category, Long> {
    Category findCategoryById(Long id);
    Category findByName(String name);
}