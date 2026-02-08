package com.prescribecorrect.app.controller;

import com.prescribecorrect.app.dto.DoctorDTO;
import com.prescribecorrect.app.dto.UserDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.Doctor;
import com.prescribecorrect.app.model.Role;
import com.prescribecorrect.app.model.Status;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.service.DoctorService;
import com.prescribecorrect.app.service.UserService;
import com.prescribecorrect.app.util.DoctorDataImporter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;
    @Autowired
    private UserService userService;
    @Autowired
    private DoctorDataImporter doctorDataImporter;

    @PostMapping("/sign-up")
    public ResponseEntity<?> singUp(@RequestBody User user) {
        user.setRole(Role.ROLE_DOCTOR);
        UserDTO createdUser = userService.save(user);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping("/add")
    public ResponseEntity<?> addDoctor(Authentication auth, @RequestBody Doctor doctor) throws NotFoundException {
        doctorService.save(auth.getName(), doctor);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<DoctorDTO>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAll());
    }

    @GetMapping("/{email}")
    public ResponseEntity<DoctorDTO> getDoctorById(@PathVariable String email) throws NotFoundException {
        return ResponseEntity.ok(doctorService.getDoctorByEmail(email));
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("")
    public ResponseEntity<?> updateDoctor(Authentication auth, @RequestBody DoctorDTO doctorDTO) throws NotFoundException {
        doctorService.edit(auth.getName(), doctorDTO);
        return ResponseEntity.ok().body("updated. wait until scarification done");
    }

    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("")
    public ResponseEntity<?> deleteDoctor(Authentication auth) throws NotFoundException {
        doctorService.delete(auth.getName());
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/status/{email}")
    public ResponseEntity<?> updateDoctorActive(@PathVariable String email, @RequestBody Status status) throws NotFoundException {
        doctorService.updaeStatus(email, status);
        return ResponseEntity.ok().build();
    }

    /**
     * Admin endpoint to import 1000+ doctors from JSON file
     * POST /api/doctor/import
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/import")
    public ResponseEntity<?> importDoctorsFromJSON() {
        try {
            doctorDataImporter.run();
            
            // Get updated stats
            List<DoctorDTO> allDoctors = doctorService.getAll();
            
            return ResponseEntity.ok(Map.of(
                "message", "Doctor import completed successfully",
                "status", "SUCCESS",
                "totalDoctors", allDoctors.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "message", "Error during import: " + e.getMessage(),
                "status", "ERROR"
            ));
        }
    }
    
    /**
     * Public endpoint to force import all remaining doctors (temporary for deployment)
     * POST /api/doctor/import-all
     */
    @PostMapping("/import-all")
    public ResponseEntity<?> forceImportAllDoctors() {
        try {
            doctorDataImporter.run();
            
            // Get updated stats
            List<DoctorDTO> allDoctors = doctorService.getAll();
            
            return ResponseEntity.ok(Map.of(
                "message", "Doctor import completed successfully",
                "status", "SUCCESS",
                "totalDoctors", allDoctors.size(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "message", "Error during import: " + e.getMessage(),
                "status", "ERROR"
            ));
        }
    }

    /**
     * Admin endpoint to check database statistics
     * GET /api/doctor/stats
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<?> getDatabaseStats() {
        List<DoctorDTO> allDoctors = doctorService.getAll();
        
        long activeCount = allDoctors.stream()
            .filter(d -> d.getStatus() == Status.ACTIVE)
            .count();
        long pendingCount = allDoctors.stream()
            .filter(d -> d.getStatus() == Status.PENDING)
            .count();
        long disabledCount = allDoctors.stream()
            .filter(d -> d.getStatus() == Status.DISABLED)
            .count();
        
        return ResponseEntity.ok(Map.of(
            "totalDoctors", allDoctors.size(),
            "active", activeCount,
            "pending", pendingCount,
            "disabled", disabledCount,
            "categories", 15,
            "message", "Database Status Report"
        ));
    }
}
