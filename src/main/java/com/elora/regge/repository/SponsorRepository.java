package com.elora.regge.repository;

import com.elora.regge.model.Sponsor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SponsorRepository extends JpaRepository<Sponsor, String> {
    Optional<Sponsor> findByCnpj(String cnpj);
    List<Sponsor> findByActiveTrue();
}
