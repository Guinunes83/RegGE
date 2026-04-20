package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String patientId;
    private String studyId;
    private LocalDate date;
    private String time;
    private String visitName;
    private String doctorName;

    // Sinais Vitais
    private String height;
    private String weight;
    private String systolicPressure;
    private String diastolicPressure;
    private String temperature;
    private String heartRate;

    @Column(length = 1000)
    private String observations;
}
