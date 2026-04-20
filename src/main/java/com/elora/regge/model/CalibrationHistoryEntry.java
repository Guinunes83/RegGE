package com.elora.regge.model;

import jakarta.persistence.Embeddable;
import java.time.LocalDate;

@Embeddable
public class CalibrationHistoryEntry {
    private LocalDate date;
    private String responsible;
    private String notes;

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getResponsible() { return responsible; }
    public void setResponsible(String responsible) { this.responsible = responsible; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
