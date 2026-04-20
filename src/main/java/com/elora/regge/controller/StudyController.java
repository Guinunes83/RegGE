package com.elora.regge.controller;

import com.elora.regge.model.Study;
import com.elora.regge.repository.StudyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/studies")
public class StudyController {

    @Autowired
    private StudyRepository repository;

    @GetMapping
    public List<Study> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Study save(@RequestBody Study study) {
        return repository.save(study);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}