package com.elora.regge.repository;

import com.elora.regge.model.KitStockEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KitStockRepository extends JpaRepository<KitStockEntry, String> {
}
