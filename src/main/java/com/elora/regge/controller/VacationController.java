package com.elora.regge.controller;

import com.elora.regge.model.VacationRecord;
import com.elora.regge.repository.VacationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacations")
public class VacationController {

    @Autowired
    private VacationRepository repository;

    @GetMapping
    public List<VacationRecord> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public VacationRecord save(@RequestBody VacationRecord record) {
        return repository.save(record);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}
