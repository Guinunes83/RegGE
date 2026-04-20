package com.elora.regge.controller;

import com.elora.regge.model.TeamMember;
import com.elora.regge.repository.TeamMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/team-members")
@CrossOrigin(origins = "*") // Permite acesso do frontend
public class TeamMemberController {

    @Autowired
    private TeamMemberRepository repository;

    @GetMapping
    public List<TeamMember> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public TeamMember upsert(@RequestBody TeamMember member) {
        if (member.getId() == null || member.getId().isEmpty()) {
            member.setId(UUID.randomUUID().toString());
        }
        // Garante IDs para as plataformas se não existirem
        if (member.getPlatforms() != null) {
            member.getPlatforms().forEach(p -> {
                if (p.getId() == null || p.getId().isEmpty()) {
                    p.setId(UUID.randomUUID().toString());
                }
            });
        }
        return repository.save(member);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}
