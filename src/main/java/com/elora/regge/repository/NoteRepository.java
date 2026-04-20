package com.elora.regge.repository;

import com.elora.regge.model.NoteItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<NoteItem, String> {
}
