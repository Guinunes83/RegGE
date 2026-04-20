package com.elora.regge.repository;

import com.elora.regge.model.MonitorEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonitorRepository extends JpaRepository<MonitorEntry, String> {
}
