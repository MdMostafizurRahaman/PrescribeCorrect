package com.prescribecorrect.app.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "prescription_analysis")
public class PrescriptionAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 10000)
    private String analysisSummary;
    
    @Column(length = 10000)
    private String fullPrescriptionText;

    @ElementCollection
    private List<String> medicines;
    
    @ElementCollection
    private List<String> keyDiseases;
    
    @ElementCollection
    private List<String> dosageInstructions;
    
    private String doctorName;
    private String patientName;

    private LocalDateTime analysisDate;
    
    private Boolean sentToChat = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_email")
    @JsonIgnore
    private User user;
}
