
package com.prescribecorrect.app.dto;

import java.util.List;
import com.prescribecorrect.app.model.PrescriptionAnalysis;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String emergencyContact;
    private String address;
    private List<PrescriptionAnalysis> medicalHistory;
    private String allergies;
    private List<String> currentMedications;
}
