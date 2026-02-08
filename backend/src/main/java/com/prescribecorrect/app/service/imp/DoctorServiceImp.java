package com.prescribecorrect.app.service.imp;

import com.prescribecorrect.app.dto.DoctorDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Doctor;
import com.prescribecorrect.app.model.Role;
import com.prescribecorrect.app.model.Status;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.repository.DoctorRepository;
import com.prescribecorrect.app.repository.UserRepository;
import com.prescribecorrect.app.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorServiceImp implements DoctorService {

    DoctorDTO convertToDoctorDTO(User user) {
        DoctorDTO dto = new DoctorDTO();
        dto.setId(user.getDoctor().getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setSpecialization(user.getDoctor().getSpecialization());
        dto.setDegree(user.getDoctor().getDegree());
        dto.setPhoneNumber(user.getDoctor().getPhoneNumber());
        dto.setChamberAddress(user.getDoctor().getChamberAddress());
        dto.setDesignation(user.getDoctor().getDesignation());
        dto.setInstitute(user.getDoctor().getInstitute());
        dto.setCurrentCity(user.getDoctor().getCurrentCity());
        dto.setAvailableTime(user.getDoctor().getAvailableTime());
        dto.setWebsiteUrl(user.getDoctor().getWebsiteUrl());
        dto.setStatus(user.getDoctor().getStatus());
        
        // Create safe user info without circular reference
        DoctorDTO.UserInfoDTO userInfo = new DoctorDTO.UserInfoDTO();
        userInfo.setFirstName(user.getFirstName());
        userInfo.setLastName(user.getLastName());
        userInfo.setEmail(user.getEmail());
        dto.setUser(userInfo);
        
        return dto;
    }

    @Autowired
    private DoctorRepository doctorRepository;
    @Autowired
    private UserRepository userRepository;

    @Override
    public void save(String email, Doctor doctor) throws NotFoundException {
        doctor.setStatus(Status.PENDING);
        doctor.setUser(userRepository.getUserByEmail(email).orElseThrow(
                () -> new NotFoundException("Doctor not found with this email")));
        doctorRepository.save(doctor);
    }

    @Override
    public List<DoctorDTO> getAll() {
        List<User> users = userRepository.findByRole(Role.ROLE_DOCTOR);

        return users.stream()
                .filter(user -> user.getDoctor() != null)
                .map(this::convertToDoctorDTO)
                .collect(Collectors.toList());
    }

    @Override
    public DoctorDTO getDoctorByEmail(String email) throws NotFoundException {
        User user = userRepository.getUserByEmail(email)
                .orElseThrow(
                        ()-> new NotFoundException("Doctor not found with id: " + email)
                );
        if (user.getDoctor() == null) {
            throw new IllegalArgumentException("Doctor info not found with id: " + email);
        }
        return convertToDoctorDTO(user);
    }

    @Override
    public void delete(String email) throws NotFoundException {
        User user = userRepository.getUserByEmail(email)
                        .orElseThrow(()-> new NotFoundException("Doctor not found with id: " + email));
        userRepository.delete(user);
    }

    @Override
    public void edit(String email, DoctorDTO doctorDTO) throws NotFoundException {
        User user = userRepository.getUserByEmail(email)
                .orElseThrow(()-> new NotFoundException("Doctor not found with id: " + email));
        user.setFirstName(doctorDTO.getFirstName());
        user.setLastName(doctorDTO.getLastName());
        userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setId(user.getDoctor().getId());
        doctor.setSpecialization(doctorDTO.getSpecialization());
        doctor.setDegree(doctorDTO.getDegree());
        doctor.setPhoneNumber(doctorDTO.getPhoneNumber());
        doctor.setChamberAddress(doctorDTO.getChamberAddress());
        doctor.setDesignation(doctorDTO.getDesignation());
        doctor.setInstitute(doctorDTO.getInstitute());
        doctor.setCurrentCity(doctorDTO.getCurrentCity());
        doctor.setAvailableTime(doctorDTO.getAvailableTime());
        doctor.setWebsiteUrl(doctorDTO.getWebsiteUrl());
        doctor.setStatus(Status.PENDING);
        doctor.setUser(user);
        doctorRepository.save(doctor);
    }

    @Override
    public void updaeStatus(String email, Status status) throws NotFoundException {
        User user = userRepository.getUserByEmail(email)
                .orElseThrow(()-> new NotFoundException("Doctor not found ..."));
        Doctor doctor = user.getDoctor();
        doctor.setStatus(status);
        userRepository.save(user);
    }
}
