package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String participantNumber;
    private String screeningNumber;
    private String name;
    private String cpf;
    private String prontuario;
    private LocalDate birthDate;
    private String sex;
    private String studyId;
    private String treatment;
    private String randomization;
    private String status;
    
    @Column(columnDefinition = "TEXT")
    private String observations;
    
    private String contact;
    private String secondaryContact;
    private LocalDate tcleDate;
}
