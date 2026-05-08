package com.elora.regge.repository;

import com.elora.regge.model.VacationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VacationRepository extends JpaRepository<VacationRecord, String> {
}
