package com.elora.regge.controller;

import com.elora.regge.model.Sponsor;
import com.elora.regge.repository.SponsorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import java.util.Optional;

@RestController
@RequestMapping("/api/sponsors")
@CrossOrigin(origins = "*")
public class SponsorController {

    @Autowired
    private SponsorRepository repository;

    @GetMapping
    public List<Sponsor> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> upsert(@RequestBody Sponsor sponsor) {
        // Check for unique CNPJ
        Optional<Sponsor> existing = repository.findByCnpj(sponsor.getCnpj());
        if (existing.isPresent() && !existing.get().getId().equals(sponsor.getId())) {
            return ResponseEntity.badRequest().body("CNPJ já cadastrado para outro patrocinador.");
        }

        if (sponsor.getId() == null || sponsor.getId().isEmpty()) {
            sponsor.setId(UUID.randomUUID().toString());
            if (sponsor.getActive() == null) {
                sponsor.setActive(true);
            }
        }
        return ResponseEntity.ok(repository.save(sponsor));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<?> toggleActive(@PathVariable String id) {
        Optional<Sponsor> sponsorOpt = repository.findById(id);
        if (sponsorOpt.isPresent()) {
            Sponsor sponsor = sponsorOpt.get();
            sponsor.setActive(!sponsor.getActive());
            return ResponseEntity.ok(repository.save(sponsor));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}
