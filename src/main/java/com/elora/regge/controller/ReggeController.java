
package com.elora.regge.controller;

import com.elora.regge.model.*;
import com.elora.regge.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

//@RestController
//@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ReggeController {

    @Autowired private StudyRepository studyRepo;
    @Autowired private TeamMemberRepository teamRepo;
    @Autowired private SponsorRepository sponsorRepo;
    @Autowired private PatientRepository patientRepo;
    @Autowired private NoteRepository noteRepo;
    @Autowired private DeviationRepository deviationRepo;
    @Autowired private CalibrationRepository calibrationRepo;
    @Autowired private ConsultationRepository consultationRepo;
    @Autowired private AssociateRepository associateRepo;

    // --- Endpoints de Estudos ---
    @GetMapping("/studies")
    public List<Study> getAllStudies() { return studyRepo.findAll(); }

    @PostMapping("/studies")
    public Study saveStudy(@RequestBody Study study) { return studyRepo.save(study); }

    @DeleteMapping("/studies/{id}")
    public void deleteStudy(@PathVariable String id) { studyRepo.deleteById(id); }

    // --- Endpoints de Membros da Equipe (Membro Equipe) ---
    @GetMapping("/team-members")
    public List<TeamMember> getAllTeam() { return teamRepo.findAll(); }

    @PostMapping("/team-members")
    public TeamMember saveTeam(@RequestBody TeamMember member) {
        // Verifica unicidade do CPF apenas para novos cadastros ou mudança de CPF
        if (member.getCpf() != null && !member.getCpf().isEmpty()) {
            teamRepo.findByCpf(member.getCpf()).ifPresent(existing -> {
                if (member.getId() == null || !existing.getId().equals(member.getId())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF já cadastrado para outro membro.");
                }
            });
        }
        return teamRepo.save(member);
    }

    @DeleteMapping("/team-members/{id}")
    public void deleteTeam(@PathVariable String id) { teamRepo.deleteById(id); }

    // --- Endpoints de Patrocinadores ---
    @GetMapping("/sponsors")
    public List<Sponsor> getAllSponsors() { return sponsorRepo.findAll(); }

    @PostMapping("/sponsors")
    public Sponsor saveSponsor(@RequestBody Sponsor sponsor) { return sponsorRepo.save(sponsor); }

    @DeleteMapping("/sponsors/{id}")
    public void deleteSponsor(@PathVariable String id) { sponsorRepo.deleteById(id); }

    // --- Endpoints de Participantes ---
    @GetMapping("/patients")
    public List<Patient> getAllPatients() { return patientRepo.findAll(); }

    @PostMapping("/patients")
    public Patient savePatient(@RequestBody Patient patient) { return patientRepo.save(patient); }

    @DeleteMapping("/patients/{id}")
    public void deletePatient(@PathVariable String id) { patientRepo.deleteById(id); }

    // --- Endpoints de Notas ---
    @GetMapping("/notes")
    public List<NoteItem> getAllNotes() { return noteRepo.findAll(); }

    // --- Endpoints de Desvios ---
    @GetMapping("/deviations")
    public List<ProtocolDeviation> getAllDeviations() { 
        List<ProtocolDeviation> list = deviationRepo.findByType("Protocolo");
        if (list.isEmpty()) {
             // Fallback for older records
            return deviationRepo.findAll().stream().filter(d -> d.getType() == null || d.getType().equals("Protocolo")).toList();
        }
        return list;
    }

    @PostMapping("/deviations")
    public ProtocolDeviation saveDeviation(@RequestBody ProtocolDeviation deviation) { 
        deviation.setType("Protocolo");
        return deviationRepo.save(deviation); 
    }

    @DeleteMapping("/deviations/{id}")
    public void deleteDeviation(@PathVariable String id) { deviationRepo.deleteById(id); }

    // --- Endpoints de GCP Deviations ---
    @GetMapping("/gcpDeviations")
    public List<ProtocolDeviation> getAllGcpDeviations() { return deviationRepo.findByType("GCP"); }

    @PostMapping("/gcpDeviations")
    public ProtocolDeviation saveGcpDeviation(@RequestBody ProtocolDeviation deviation) { 
        deviation.setType("GCP");
        return deviationRepo.save(deviation); 
    }

    @DeleteMapping("/gcpDeviations/{id}")
    public void deleteGcpDeviation(@PathVariable String id) { deviationRepo.deleteById(id); }

    // --- Endpoints de SAE Deviations ---
    @GetMapping("/saeDeviations")
    public List<ProtocolDeviation> getAllSaeDeviations() { return deviationRepo.findByType("SAE"); }

    @PostMapping("/saeDeviations")
    public ProtocolDeviation saveSaeDeviation(@RequestBody ProtocolDeviation deviation) { 
        deviation.setType("SAE");
        return deviationRepo.save(deviation); 
    }

    @DeleteMapping("/saeDeviations/{id}")
    public void deleteSaeDeviation(@PathVariable String id) { deviationRepo.deleteById(id); }

    // --- Endpoints de Calibrações ---
    @GetMapping("/calibrations")
    public List<Calibration> getAllCalibrations() { return calibrationRepo.findAll(); }

    @PostMapping("/calibrations")
    public Calibration saveCalibration(@RequestBody Calibration calibration) { return calibrationRepo.save(calibration); }

    @DeleteMapping("/calibrations/{id}")
    public void deleteCalibration(@PathVariable String id) { calibrationRepo.deleteById(id); }

    // --- Endpoints de Consultas ---
    @GetMapping("/consultations")
    public List<Consultation> getAllConsultations() { return consultationRepo.findAll(); }

    @PostMapping("/consultations")
    public Consultation saveConsultation(@RequestBody Consultation consultation) { return consultationRepo.save(consultation); }

    @DeleteMapping("/consultations/{id}")
    public void deleteConsultation(@PathVariable String id) { consultationRepo.deleteById(id); }

    // --- Endpoints de Associados ---
    @GetMapping("/associates")
    public List<Associate> getAllAssociates() { return associateRepo.findAll(); }

    @PostMapping("/associates")
    public Associate saveAssociate(@RequestBody Associate associate) { return associateRepo.save(associate); }

    @DeleteMapping("/associates/{id}")
    public void deleteAssociate(@PathVariable String id) { associateRepo.deleteById(id); }
}
