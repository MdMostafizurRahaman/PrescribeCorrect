package com.prescribecorrect.app.controller;

import com.prescribecorrect.app.dto.PrescriptionAnalysisDTO;
import com.prescribecorrect.app.exception.NotFoundException;
import com.prescribecorrect.app.model.PrescriptionAnalysis;
import com.prescribecorrect.app.service.PrescriptionAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analysis")
public class PrescriptionAnalysisController {

    @Autowired
    private PrescriptionAnalysisService analysisService;

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/save")
    public ResponseEntity<PrescriptionAnalysisDTO> saveAnalysis(
            Authentication auth,
            @RequestBody PrescriptionAnalysis analysis) throws NotFoundException {
        String userEmail = auth.getName();
        PrescriptionAnalysisDTO savedAnalysis = analysisService.saveAnalysis(analysis, userEmail);
        return ResponseEntity.ok(savedAnalysis);
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/my-analyses")
    public ResponseEntity<List<PrescriptionAnalysisDTO>> getMyAnalyses(Authentication auth) throws NotFoundException {
        String userEmail = auth.getName();
        List<PrescriptionAnalysisDTO> analyses = analysisService.getUserAnalyses(userEmail);
        return ResponseEntity.ok(analyses);
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionAnalysisDTO> getAnalysisById(@PathVariable Long id) throws NotFoundException {
        PrescriptionAnalysisDTO analysis = analysisService.getAnalysisById(id);
        return ResponseEntity.ok(analysis);
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{id}/send-to-chat")
    public ResponseEntity<PrescriptionAnalysisDTO> sendToChat(
            Authentication auth,
            @PathVariable Long id) throws NotFoundException {
        String userEmail = auth.getName();
        PrescriptionAnalysisDTO analysis = analysisService.sendAnalysisToChat(id, userEmail);
        return ResponseEntity.ok(analysis);
    }
}
