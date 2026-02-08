package com.prescribecorrect.app.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PrescriptionAnalysisDTO {
    private Long id;
    private String analysisSummary;
    private String fullPrescriptionText;
    private List<String> medicines;
    private List<String> keyDiseases;
    private List<String> dosageInstructions;
    private String doctorName;
    private String patientName;
    private LocalDateTime analysisDate;
    private Boolean sentToChat;
    private String userEmail;
}
