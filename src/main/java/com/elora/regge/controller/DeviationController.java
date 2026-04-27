package com.elora.regge.controller;

import com.elora.regge.model.ProtocolDeviation;
import com.elora.regge.repository.DeviationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DeviationController {

    @Autowired
    private DeviationRepository deviationRepo;

    @GetMapping("/deviations")
    public List<ProtocolDeviation> getAllDeviations() {
        List<ProtocolDeviation> list = deviationRepo.findByType("Protocolo");
        if (list.isEmpty()) {
            return deviationRepo.findAll().stream()
                    .filter(d -> d.getType() == null || d.getType().equals("Protocolo"))
                    .collect(Collectors.toList());
        }
        return list;
    }

    @PostMapping("/deviations")
    public ProtocolDeviation saveDeviation(@RequestBody ProtocolDeviation deviation) {
        deviation.setType("Protocolo");
        return deviationRepo.save(deviation);
    }

    @DeleteMapping("/deviations/{id}")
    public ResponseEntity<Void> deleteDeviation(@PathVariable String id) {
        deviationRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/gcpDeviations")
    public List<ProtocolDeviation> getAllGcpDeviations() {
        return deviationRepo.findByType("GCP");
    }

    @PostMapping("/gcpDeviations")
    public ProtocolDeviation saveGcpDeviation(@RequestBody ProtocolDeviation deviation) {
        deviation.setType("GCP");
        return deviationRepo.save(deviation);
    }

    @DeleteMapping("/gcpDeviations/{id}")
    public ResponseEntity<Void> deleteGcpDeviation(@PathVariable String id) {
        deviationRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/saeDeviations")
    public List<ProtocolDeviation> getAllSaeDeviations() {
        return deviationRepo.findByType("SAE");
    }

    @PostMapping("/saeDeviations")
    public ProtocolDeviation saveSaeDeviation(@RequestBody ProtocolDeviation deviation) {
        deviation.setType("SAE");
        return deviationRepo.save(deviation);
    }

    @DeleteMapping("/saeDeviations/{id}")
    public ResponseEntity<Void> deleteSaeDeviation(@PathVariable String id) {
        deviationRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
