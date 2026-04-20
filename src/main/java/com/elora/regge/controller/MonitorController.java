package com.elora.regge.controller;

import com.elora.regge.model.MonitorEntry;
import com.elora.regge.repository.MonitorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/monitors")
@CrossOrigin(origins = "*")
public class MonitorController {

    @Autowired
    private MonitorRepository repository;

    @GetMapping
    public List<MonitorEntry> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public MonitorEntry upsert(@RequestBody MonitorEntry monitor) {
        if (monitor.getId() == null || monitor.getId().isEmpty()) {
            monitor.setId(UUID.randomUUID().toString());
        }
        if (monitor.getLogins() != null) {
            monitor.getLogins().forEach(l -> {
                if (l.getId() == null || l.getId().isEmpty()) {
                    l.setId(UUID.randomUUID().toString());
                }
            });
        }
        return repository.save(monitor);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}
