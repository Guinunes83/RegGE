package com.elora.regge.controller;

import com.elora.regge.model.NoteItem;
import com.elora.regge.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteRepository repository;

    @GetMapping
    public List<NoteItem> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public NoteItem save(@RequestBody NoteItem note) {
        return repository.save(note);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}