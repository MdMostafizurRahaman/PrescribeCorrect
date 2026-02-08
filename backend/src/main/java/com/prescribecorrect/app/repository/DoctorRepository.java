package com.prescribecorrect.app.repository;

import com.prescribecorrect.app.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor,Long> {
}
