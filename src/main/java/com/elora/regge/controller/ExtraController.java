package com.elora.regge.controller;

import com.elora.regge.model.Calibration;
import com.elora.regge.model.Consultation;
import com.elora.regge.model.Associate;
import com.elora.regge.repository.CalibrationRepository;
import com.elora.regge.repository.ConsultationRepository;
import com.elora.regge.repository.AssociateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ExtraController {

    @Autowired private CalibrationRepository calibrationRepo;
    @Autowired private ConsultationRepository consultationRepo;
    @Autowired private AssociateRepository associateRepo;

    // --- Endpoints de Calibrações ---
    @GetMapping("/calibrations")
    public List<Calibration> getAllCalibrations() { return calibrationRepo.findAll(); }

    @PostMapping("/calibrations")
    public Calibration saveCalibration(@RequestBody Calibration calibration) { return calibrationRepo.save(calibration); }

    @DeleteMapping("/calibrations/{id}")
    public ResponseEntity<Void> deleteCalibration(@PathVariable String id) {
        calibrationRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- Endpoints de Consultas ---
    @GetMapping("/consultations")
    public List<Consultation> getAllConsultations() { return consultationRepo.findAll(); }

    @PostMapping("/consultations")
    public Consultation saveConsultation(@RequestBody Consultation consultation) { return consultationRepo.save(consultation); }

    @DeleteMapping("/consultations/{id}")
    public ResponseEntity<Void> deleteConsultation(@PathVariable String id) {
        consultationRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- Endpoints de Associados ---
    @GetMapping("/associates")
    public List<Associate> getAllAssociates() { return associateRepo.findAll(); }

    @PostMapping("/associates")
    public Associate saveAssociate(@RequestBody Associate associate) { return associateRepo.save(associate); }

    @DeleteMapping("/associates/{id}")
    public ResponseEntity<Void> deleteAssociate(@PathVariable String id) {
        associateRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
