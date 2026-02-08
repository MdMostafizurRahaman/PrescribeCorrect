package com.prescribecorrect.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private List<String> specialization;

    private List<String> degree;

    private List<String> phoneNumber;
    private String chamberAddress;

    private String designation;
    private String institute;
    private String currentCity;

    private String availableTime;

    private String websiteUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @OneToOne
    @JoinColumn(name = "user_email", nullable = false)
    private User user;

}
