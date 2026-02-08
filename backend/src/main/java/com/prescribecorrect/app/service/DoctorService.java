package com.prescribecorrect.app.service;

import com.prescribecorrect.app.dto.DoctorDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Doctor;
import com.prescribecorrect.app.model.Status;
import com.prescribecorrect.app.model.User;

import javax.print.Doc;
import java.util.List;

public interface DoctorService {
    void save(String email, Doctor doctor) throws NotFoundException;

    List<DoctorDTO> getAll();

    DoctorDTO getDoctorByEmail(String email) throws NotFoundException;

    void delete(String email) throws NotFoundException;

    void edit(String email, DoctorDTO doctorDTO) throws NotFoundException;

    void updaeStatus(String email, Status status) throws NotFoundException;
}
