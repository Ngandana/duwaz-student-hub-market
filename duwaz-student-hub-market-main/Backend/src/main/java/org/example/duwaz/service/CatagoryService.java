package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Category;
import org.example.duwaz.repo.CatagoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CatagoryService {

    private final CatagoryRepository catagoryRepository;

    public CatagoryService(CatagoryRepository catagoryRepository) {
        this.catagoryRepository = catagoryRepository;
    }

    public List<Category> getAllCategories() {
        return catagoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return catagoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id " + id));
    }

    public Category createCategory(Category category) {
        return catagoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category category) {
        Category existing = catagoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id " + id));
        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        return catagoryRepository.save(existing);
    }

    public void deleteCategory(Long id) {
        catagoryRepository.deleteById(id);
    }
}
