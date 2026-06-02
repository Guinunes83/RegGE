package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "studies")
public class Study {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String alternativeName;
    private String coordinatorCenter;
    private String protocol;
    private String sponsor;
    private String pi; 
    private String cro;
    private String coordinator;
    private String pathology;
    private String recruitment;
    private String centerNumber;
    private String caae;
    
    @Column(length = 1000)
    private String credentials;
    
    private String status; // Active, Closed, Pending

    @ElementCollection
    private List<String> participantsIds;

    private String studyType;
    private String medicationRoute;
    private String studyParticipantsCount;

    // Seção Regulatório
    private String regulatoryObs;
    private String tituloEstudo;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "study_id")
    private List<PlatformAccess> susarPlatforms = new ArrayList<>();

    // Seção Índices (Datas)
    private String feasibilityReceptionDate;
    private String feasibilitySigningDate;
    private String centerSelectionNoticeDate;
    private String contractReceptionDate;
    private String contractSigningDate;
    private String initialDossierReceptionDate;
    private String initialDossierSubmissionDate;
    private String cepAcceptanceDate;
    private String initialOpinionApprovalDate;
    private String centerActivationDate;
    private String firstParticipantDate;
    private String firstRandomizedDate;
    private String finalOpinionDate;

    private Boolean active = true;
}