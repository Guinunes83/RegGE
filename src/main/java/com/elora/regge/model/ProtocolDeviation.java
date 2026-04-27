
package com.elora.regge.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "protocol_deviations")
public class ProtocolDeviation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "study_id")
    private String studyId;

    private String piName;
    private String centerNumber;
    
    @Column(name = "patient_id")
    private String patientId;
    
    private String patientNumber;
    
    private String occurrenceDate;
    private String deviationDate;

    @Column(length = 500)
    private String description;
    
    private String status; // Pendente, Gerado

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudyId() { return studyId; }
    public void setStudyId(String studyId) { this.studyId = studyId; }

    public String getPiName() { return piName; }
    public void setPiName(String piName) { this.piName = piName; }

    public String getCenterNumber() { return centerNumber; }
    public void setCenterNumber(String centerNumber) { this.centerNumber = centerNumber; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientNumber() { return patientNumber; }
    public void setPatientNumber(String patientNumber) { this.patientNumber = patientNumber; }

    public String getOccurrenceDate() { return occurrenceDate; }
    public void setOccurrenceDate(String occurrenceDate) { this.occurrenceDate = occurrenceDate; }

    public String getDeviationDate() { return deviationDate; }
    public void setDeviationDate(String deviationDate) { this.deviationDate = deviationDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
