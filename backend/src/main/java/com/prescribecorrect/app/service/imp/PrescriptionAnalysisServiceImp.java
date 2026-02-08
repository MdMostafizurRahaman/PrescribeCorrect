package com.prescribecorrect.app.service.imp;

import com.prescribecorrect.app.dto.PrescriptionAnalysisDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.PrescriptionAnalysis;
import com.prescribecorrect.app.model.User;
import com.prescribecorrect.app.repository.PrescriptionAnalysisRepository;
import com.prescribecorrect.app.repository.UserRepository;
import com.prescribecorrect.app.service.PrescriptionAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PrescriptionAnalysisServiceImp implements PrescriptionAnalysisService {

    @Autowired
    private PrescriptionAnalysisRepository analysisRepository;

    @Autowired
    private UserRepository userRepository;

    private PrescriptionAnalysisDTO convertToDTO(PrescriptionAnalysis analysis) {
        PrescriptionAnalysisDTO dto = new PrescriptionAnalysisDTO();
        dto.setId(analysis.getId());
        dto.setAnalysisSummary(analysis.getAnalysisSummary());
        dto.setFullPrescriptionText(analysis.getFullPrescriptionText());
        dto.setMedicines(analysis.getMedicines());
        dto.setKeyDiseases(analysis.getKeyDiseases());
        dto.setDosageInstructions(analysis.getDosageInstructions());
        dto.setDoctorName(analysis.getDoctorName());
        dto.setPatientName(analysis.getPatientName());
        dto.setAnalysisDate(analysis.getAnalysisDate());
        dto.setSentToChat(analysis.getSentToChat());
        dto.setUserEmail(analysis.getUser().getEmail());
        return dto;
    }

    @Override
    public PrescriptionAnalysisDTO saveAnalysis(PrescriptionAnalysis analysis, String userEmail) throws NotFoundException {
        User user = userRepository.getUserByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        analysis.setUser(user);
        analysis.setAnalysisDate(LocalDateTime.now());
        analysis.setSentToChat(false);
        
        PrescriptionAnalysis savedAnalysis = analysisRepository.save(analysis);
        return convertToDTO(savedAnalysis);
    }

    @Override
    public List<PrescriptionAnalysisDTO> getUserAnalyses(String userEmail) throws NotFoundException {
        User user = userRepository.getUserByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        List<PrescriptionAnalysis> analyses = analysisRepository
                .findByUser_EmailOrderByAnalysisDateDesc(userEmail);

        return analyses.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }


    @Override
    public PrescriptionAnalysisDTO getAnalysisById(Long id) throws NotFoundException {
        PrescriptionAnalysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Analysis not found"));
        return convertToDTO(analysis);
    }

    @Override
    public PrescriptionAnalysisDTO sendAnalysisToChat(Long analysisId, String userEmail) throws NotFoundException {
        PrescriptionAnalysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new NotFoundException("Analysis not found"));
        
        if (!analysis.getUser().getEmail().equals(userEmail)) {
            throw new NotFoundException("Analysis not found for this user");
        }
        
        analysis.setSentToChat(true);
        PrescriptionAnalysis updatedAnalysis = analysisRepository.save(analysis);
        return convertToDTO(updatedAnalysis);
    }
}
