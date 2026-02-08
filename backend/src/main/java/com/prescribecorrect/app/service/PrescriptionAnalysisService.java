package com.prescribecorrect.app.service;

import com.prescribecorrect.app.dto.PrescriptionAnalysisDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.PrescriptionAnalysis;

import java.util.List;

public interface PrescriptionAnalysisService {
    PrescriptionAnalysisDTO saveAnalysis(PrescriptionAnalysis analysis, String userEmail) throws NotFoundException;
    List<PrescriptionAnalysisDTO> getUserAnalyses(String userEmail) throws NotFoundException;
    PrescriptionAnalysisDTO getAnalysisById(Long id) throws NotFoundException;
    PrescriptionAnalysisDTO sendAnalysisToChat(Long analysisId, String userEmail) throws NotFoundException;
}
