package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.repo.BusinessRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.mockito.AdditionalAnswers.returnsFirstArg;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BusinessServiceTest {

    @Mock
    private BusinessRepository businessRepository;

    @Autowired
    private BusinessService businessService;

    @Autowired
    private StudentService studentService;

    static private Business business;
    static Business saved;

    @BeforeAll
    static void setUp() {
         Student student = new Student();
        student.setStudentNumber("221145687");
        student.setStudentName("John");

        business = new Business();
        business.setId(2L);
        business.setName("DOAS");
        business.setStudent(student);
    }

    @Test()
    @Order(1)
    void testSaveBusiness() {


        studentService.saveStudent(business.getStudent());
         saved = businessService.saveBusiness(business);
        System.out.println("saved: "+ saved);
        assertNotNull(saved);
    }

    @Test
    @Order(2)
    void testFindBusinessById() {
        Business found = businessService.findBusinessById(saved.getId());
        assertNotNull(found);
        System.out.println(found);
    }


    @Test
    @Order(3)
    void testUpdateBusiness() {
        saved.setName("UpdatedName");

        Business updated = businessService.updateBusiness(saved.getId(), saved);

        assertEquals("UpdatedName", updated.getBusinessName());

        System.out.println(updated);
    }


    @Test
    @Order(4)
    void testGetAllBusiness() {
        System.out.println(businessService.getAllBusiness());
    }

    @Test
    @Order(5)
    void testDeleteBusinessById() {

        boolean isDeleted = businessService.deleteBusinessById(saved.getId());
        assertEquals(true, isDeleted);

    }

}


