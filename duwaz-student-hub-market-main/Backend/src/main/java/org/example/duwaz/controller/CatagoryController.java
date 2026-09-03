package org.example.duwaz.controller;

import org.example.duwaz.classesFolder.Category;
import org.example.duwaz.dto.response.CategoryDTO;
import org.example.duwaz.dto.response.DtoMapper;
import org.example.duwaz.service.CatagoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CatagoryController {

    private final CatagoryService catagoryService;

    @Autowired
    public CatagoryController(CatagoryService catagoryService) {
        this.catagoryService = catagoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<Category> categories = catagoryService.getAllCategories();
        return new ResponseEntity<>(DtoMapper.categoryList(categories), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        Category category = catagoryService.getCategoryById(id);
        return new ResponseEntity<>(DtoMapper.toDto(category), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody Category category) {
        Category createdCategory = catagoryService.createCategory(category);
        return new ResponseEntity<>(DtoMapper.toDto(createdCategory), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        Category updatedCategory = catagoryService.updateCategory(id, category);
        return new ResponseEntity<>(DtoMapper.toDto(updatedCategory), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        catagoryService.deleteCategory(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}