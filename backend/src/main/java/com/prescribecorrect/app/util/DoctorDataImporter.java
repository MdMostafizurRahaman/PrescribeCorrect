package com.prescribecorrect.app.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prescribecorrect.app.model.Doctor;
import com.prescribecorrect.app.model.Role;
import com.prescribecorrect.app.model.Status;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.repository.DoctorRepository;
import com.prescribecorrect.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Data Importer for loading 1000+ Bangladesh doctors from JSON file
 * This can be run once to populate the database with real doctor data
 */
@Component
public class DoctorDataImporter implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String JSON_FILE_PATH = "doctors_data.json";
    private static final String ENCODED_PASSWORD = "$2a$10$slYQmyNdGzin7olVaML..."; // Use a real BCrypt hash

    @Override
    public void run(String... args) throws Exception {
        // Check if import is needed (only if no doctors exist)
        if (userRepository.findByRole(Role.ROLE_DOCTOR).isEmpty()) {
            System.out.println("🏥 Starting Doctor Data Import...");
            try {
                importDoctorsFromJSON();
                System.out.println("✅ Doctor import completed successfully!");
            } catch (Exception e) {
                System.err.println("❌ Error during doctor import: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("⏭️  Doctors already exist in database. Skipping import.");
            verifyImport();
        }
    }
    
    /**
     * Verify and complete any missing imports
     */
    private void verifyImport() {
        try {
            long existingDoctors = userRepository.findByRole(Role.ROLE_DOCTOR).size();
            System.out.println("🔍 Database Verification:");
            System.out.println("   👨‍⚕️ Total Doctors in Database: " + existingDoctors);
            
            if (existingDoctors < 1050) {
                System.out.println("   ⚠️  PARTIAL: Some doctors imported (" + existingDoctors + ")");
                System.out.println("   🔄 Attempting to import remaining doctors...");
                importDoctorsFromJSON();
            } else {
                System.out.println("   ✅ COMPLETE: All doctors imported successfully!");
            }
        } catch (Exception e) {
            System.err.println("❌ Error during verification: " + e.getMessage());
        }
    }

    private void importDoctorsFromJSON() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        File file = new File(JSON_FILE_PATH);

        if (!file.exists()) {
            System.out.println("⚠️  JSON file not found: " + JSON_FILE_PATH);
            return;
        }

        // Parse JSON
        Map<String, Object> data = mapper.readValue(file, Map.class);
        List<Map<String, Object>> users = (List<Map<String, Object>>) data.get("users");
        List<Map<String, Object>> doctors = (List<Map<String, Object>>) data.get("doctors");

        if (users == null || doctors == null) {
            System.out.println("⚠️  Invalid JSON structure");
            return;
        }

        int userCount = 0;
        int doctorCount = 0;
        int skipped = 0;

        // Import Users first
        for (Map<String, Object> userData : users) {
            try {
                User user = createUserFromMap(userData);
                
                // Check if user already exists
                Optional<User> existing = userRepository.getUserByEmail(user.getEmail());
                if (!existing.isPresent()) {
                    userRepository.save(user);
                    userCount++;
                } else {
                    skipped++;
                }

                if (userCount % 100 == 0) {
                    System.out.println("   Imported " + userCount + " users...");
                }
            } catch (Exception e) {
                System.err.println("   ⚠️  Error importing user: " + e.getMessage());
            }
        }

        // Import Doctors
        for (Map<String, Object> doctorData : doctors) {
            try {
                String email = (String) doctorData.get("email");
                Optional<User> userOptional = userRepository.getUserByEmail(email);
                
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    
                    // Check if doctor profile already exists for this user
                    if (user.getDoctor() == null) {
                        Doctor doctor = createDoctorFromMap(doctorData);
                        doctor.setUser(user);
                        doctorRepository.save(doctor);
                        doctorCount++;
                        
                        if (doctorCount % 100 == 0) {
                            System.out.println("   Imported " + doctorCount + " doctors...");
                        }
                    } else {
                        skipped++;
                    }
                }
            } catch (Exception e) {
                System.err.println("   ⚠️  Error importing doctor: " + e.getMessage());
            }
        }

        System.out.println("\n📊 Import Summary:");
        System.out.println("   ✅ Users imported: " + userCount);
        System.out.println("   ✅ Doctors imported: " + doctorCount);
        System.out.println("   ⏭️  Skipped (already exist): " + skipped);
        System.out.println("   📈 Total: " + (userCount + doctorCount) + " records");
    }

    private User createUserFromMap(Map<String, Object> map) {
        User user = new User();
        user.setEmail((String) map.get("email"));
        
        // Use a default hashed password - should be the same for all imported doctors
        String password = (String) map.get("password");
        user.setPassword(password != null ? password : 
            "$2a$10$slYQmyNdGzin7olVaML8MuVs.5W6OFcNnHhUP9ZNqVnqW3GFxc3dm"); // BCrypt hash of "doctor123"
        
        user.setFirstName((String) map.get("firstName"));
        user.setLastName((String) map.get("lastName"));
        user.setPhoneNumber((String) map.get("phoneNumber"));
        user.setGender((String) map.get("gender"));
        user.setDateOfBirth((String) map.get("dateOfBirth"));
        user.setAddress((String) map.get("address"));
        user.setRole(Role.ROLE_DOCTOR);
        
        return user;
    }

    private Doctor createDoctorFromMap(Map<String, Object> map) {
        Doctor doctor = new Doctor();
        doctor.setSpecialization((List<String>) map.get("specialization"));
        doctor.setDegree((List<String>) map.get("degree"));
        doctor.setPhoneNumber((List<String>) map.get("phoneNumber"));
        doctor.setChamberAddress((String) map.get("chamberAddress"));
        doctor.setDesignation((String) map.get("designation"));
        doctor.setInstitute((String) map.get("institute"));
        doctor.setCurrentCity((String) map.get("currentCity"));
        doctor.setAvailableTime((String) map.get("availableTime"));
        doctor.setWebsiteUrl((String) map.get("websiteUrl"));
        
        // Parse status
        String statusStr = (String) map.get("status");
        try {
            doctor.setStatus(Status.valueOf(statusStr));
        } catch (Exception e) {
            doctor.setStatus(Status.PENDING);
        }
        
        return doctor;
    }
}
