package org.example.duwaz.service;

import org.example.duwaz.classesFolder.Student;
import org.example.duwaz.repo.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;

    private Student student;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);
        student.setName("Test Student");
        // Set other necessary student fields
    }

    @Test
    void testSaveStudent() {
        // Arrange
        when(studentRepository.save(any(Student.class))).thenReturn(student);

        // Act
        Student savedStudent = studentService.saveStudent(student);

        // Assert
        assertNotNull(savedStudent, "Saved student should not be null");
        assertEquals(student.getName(), savedStudent.getName());
        assertEquals(student.getId(), savedStudent.getId());

        // Verify
        verify(studentRepository, times(1)).save(any(Student.class));
    }

    @Test
    void testFindStudentById() {
        // Arrange
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

        // Act
        Student found = studentService.findStudentById(1L);

        // Assert
        assertNotNull(found, "Found student should not be null");
        assertEquals(student.getId(), found.getId());
        assertEquals(student.getName(), found.getName());

        // Verify
        verify(studentRepository, times(1)).findById(1L);
    }

    @Test
    void testFindStudentById_NotFound() {
        // Arrange
        when(studentRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            studentService.findStudentById(999L);
        });

        // Verify
        verify(studentRepository, times(1)).findById(999L);
    }

    @Test
    void testGetAllStudents() {
        // Arrange
        List<Student> studentList = Arrays.asList(
            student,
            createStudent(2L, "Another Student")
        );
        when(studentRepository.findAll()).thenReturn(studentList);

        // Act
        List<Student> students = studentService.getAllStudents();

        // Assert
        assertNotNull(students, "Students list should not be null");
        assertEquals(2, students.size(), "Should return 2 students");
        assertEquals(student.getName(), students.get(0).getName());

        // Verify
        verify(studentRepository, times(1)).findAll();
    }

    @Test
    void testDeleteStudentById() {
        // Arrange
        Long studentId = 1L;
        doNothing().when(studentRepository).deleteById(studentId);

        // Act
        studentService.deleteStudentById(studentId);

        // Verify
        verify(studentRepository, times(1)).deleteById(studentId);
    }

    private Student createStudent(Long id, String name) {
        Student newStudent = new Student();
        newStudent.setId(id);
        newStudent.setName(name);
        return newStudent;
    }
}