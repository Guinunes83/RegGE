package com.elora.regge.controller;

import com.elora.regge.model.KitStockEntry;
import com.elora.regge.repository.KitStockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/kit-stock")
@CrossOrigin(origins = "*")
public class KitStockController {

    @Autowired
    private KitStockRepository repository;

    @GetMapping
    public List<KitStockEntry> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public KitStockEntry upsert(@RequestBody KitStockEntry entry) {
        return repository.save(entry);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}
