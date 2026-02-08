package com.prescribecorrect.app.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "users")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User {
    @Id
    private String email;

    private String password;

    private String firstName;

    private String lastName;

    private String phoneNumber;
    private String dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String emergencyContact;
    private String address;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<PrescriptionAnalysis> medicalHistory;

    @Column(length = 1000)
    private String allergies;

    @ElementCollection
    private List<String> currentMedications;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    List<Chat> chats;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Doctor doctor;
}
