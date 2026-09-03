package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Business;
import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.repo.BusinessRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Pure unit test — the repository is mocked, so this never touches a real database.
 *
 * (Previously this class was a @SpringBootTest that wired the real BusinessService/
 * StudentService beans against the live Supabase datasource configured in
 * application.properties, with no @Transactional rollback and no test-only DB. That
 * meant every `mvn test` run attempted real INSERT/UPDATE/DELETE statements against
 * production data — and failed outright because the test's Student had no email,
 * which violates the not-null constraint. Rewritten to match the StudentServiceTest
 * pattern instead: mock the repository, test the service in isolation.)
 */
@ExtendWith(MockitoExtension.class)
class BusinessServiceTest {

    @Mock
    private BusinessRepository businessRepository;

    @InjectMocks
    private BusinessService businessService;

    private Business business;

    @BeforeEach
    void setUp() {
        Student student = new Student();
        student.setId(1L);
        student.setStudentName("John");
        student.setStudentNumber("221145687");
        student.setEmail("john@example.com");

        business = new Business();
        business.setId(2L);
        business.setName("DOAS");
        business.setStudent(student);
    }

    @Test
    void testSaveBusiness() {
        when(businessRepository.save(any(Business.class))).thenReturn(business);

        Business saved = businessService.saveBusiness(business);

        assertNotNull(saved);
        assertEquals("DOAS", saved.getBusinessName());
        verify(businessRepository, times(1)).save(business);
    }

    @Test
    void testFindBusinessById() {
        when(businessRepository.findById(2L)).thenReturn(Optional.of(business));

        Business found = businessService.findBusinessById(2L);

        assertNotNull(found);
        assertEquals(business.getId(), found.getId());
    }

    @Test
    void testFindBusinessById_NotFound() {
        when(businessRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> businessService.findBusinessById(999L));
    }

    @Test
    void testUpdateBusiness() {
        when(businessRepository.findById(2L)).thenReturn(Optional.of(business));
        when(businessRepository.save(any(Business.class))).thenAnswer(inv -> inv.getArgument(0));

        Business patch = new Business();
        patch.setName("UpdatedName");

        Business updated = businessService.updateBusiness(2L, patch);

        assertEquals("UpdatedName", updated.getBusinessName());
    }

    @Test
    void testGetAllBusiness() {
        when(businessRepository.findAll()).thenReturn(List.of(business));

        List<Business> all = businessService.getAllBusiness();

        assertEquals(1, all.size());
    }

    @Test
    void testDeleteBusinessById() {
        when(businessRepository.existsById(2L)).thenReturn(false);

        boolean deleted = businessService.deleteBusinessById(2L);

        assertTrue(deleted);
        verify(businessRepository, times(1)).deleteById(2L);
    }
}
