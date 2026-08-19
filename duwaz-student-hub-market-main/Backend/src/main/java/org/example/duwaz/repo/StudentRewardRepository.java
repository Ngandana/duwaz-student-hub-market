package org.example.duwaz.repo;

import org.example.duwaz.classesFolder.StudentReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRewardRepository extends JpaRepository<StudentReward, Long> {

    List<StudentReward> findByStudentIdOrderByEarnedAtDesc(Long studentId);

    boolean existsByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(r.pointsEarned), 0) FROM StudentReward r WHERE r.student.id = :studentId")
    int sumPointsByStudentId(@Param("studentId") Long studentId);
}
