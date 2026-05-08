package com.elora.regge.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vacations")
public class VacationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String employeeId;
    private String startDate;
    private String endDate;
    private String status;
    @Column(length = 1000)
    private String notes;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
