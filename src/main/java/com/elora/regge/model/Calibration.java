package com.elora.regge.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "calibrations")
public class Calibration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String assetCode; // Cód. Patrimônio
    private String reference; // Referência
    private LocalDate calibrationDate; // Data da calibração
    private int expirationPeriod; // Número
    private String expirationUnit; // "Days", "Months", "Years"
    private LocalDate nextCalibrationDate; // Calculado
    private String responsible; // Responsável

    @ElementCollection
    @CollectionTable(name = "calibration_history", joinColumns = @JoinColumn(name = "calibration_id"))
    private List<CalibrationHistoryEntry> history = new ArrayList<>();

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssetCode() { return assetCode; }
    public void setAssetCode(String assetCode) { this.assetCode = assetCode; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public LocalDate getCalibrationDate() { return calibrationDate; }
    public void setCalibrationDate(LocalDate calibrationDate) { this.calibrationDate = calibrationDate; }

    public int getExpirationPeriod() { return expirationPeriod; }
    public void setExpirationPeriod(int expirationPeriod) { this.expirationPeriod = expirationPeriod; }

    public String getExpirationUnit() { return expirationUnit; }
    public void setExpirationUnit(String expirationUnit) { this.expirationUnit = expirationUnit; }

    public LocalDate getNextCalibrationDate() { return nextCalibrationDate; }
    public void setNextCalibrationDate(LocalDate nextCalibrationDate) { this.nextCalibrationDate = nextCalibrationDate; }

    public String getResponsible() { return responsible; }
    public void setResponsible(String responsible) { this.responsible = responsible; }

    public List<CalibrationHistoryEntry> getHistory() { return history; }
    public void setHistory(List<CalibrationHistoryEntry> history) { this.history = history; }
}
