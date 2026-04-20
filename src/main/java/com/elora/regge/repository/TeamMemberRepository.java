package com.elora.regge.repository;

import com.elora.regge.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional; // <--- ESTA É A LINHA QUE FALTAVA

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, String> {
    
    Optional<TeamMember> findByCpf(String cpf);

}