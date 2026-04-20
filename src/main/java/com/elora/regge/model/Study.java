
package com.elora.regge.model;

import jakarta.persistence.*;
import java.util.List;

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
    private String ciomsDistribution;
    
    @Column(length = 1000)
    private String credentials;
    
    private String status; // Active, Closed, Pending

    @ElementCollection
    private List<String> participantsIds;

    private String studyType;
    private String medicationRoute;
    private String studyParticipantsCount;

    // Seção Regulatório
    private String regulatoryCAAE;
    private String regulatoryCenterNumber;
    private String regulatoryObs;
    private String regulatorySusarPlatform;

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

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAlternativeName() { return alternativeName; }
    public void setAlternativeName(String alternativeName) { this.alternativeName = alternativeName; }

    public String getCoordinatorCenter() { return coordinatorCenter; }
    public void setCoordinatorCenter(String coordinatorCenter) { this.coordinatorCenter = coordinatorCenter; }

    public String getProtocol() { return protocol; }
    public void setProtocol(String protocol) { this.protocol = protocol; }

    public String getSponsor() { return sponsor; }
    public void setSponsor(String sponsor) { this.sponsor = sponsor; }

    public String getPi() { return pi; }
    public void setPi(String pi) { this.pi = pi; }

    public String getCro() { return cro; }
    public void setCro(String cro) { this.cro = cro; }

    public String getCoordinator() { return coordinator; }
    public void setCoordinator(String coordinator) { this.coordinator = coordinator; }

    public String getPathology() { return pathology; }
    public void setPathology(String pathology) { this.pathology = pathology; }

    public String getRecruitment() { return recruitment; }
    public void setRecruitment(String recruitment) { this.recruitment = recruitment; }

    public String getCenterNumber() { return centerNumber; }
    public void setCenterNumber(String centerNumber) { this.centerNumber = centerNumber; }

    public String getCaae() { return caae; }
    public void setCaae(String caae) { this.caae = caae; }

    public String getCiomsDistribution() { return ciomsDistribution; }
    public void setCiomsDistribution(String ciomsDistribution) { this.ciomsDistribution = ciomsDistribution; }

    public String getCredentials() { return credentials; }
    public void setCredentials(String credentials) { this.credentials = credentials; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getParticipantsIds() { return participantsIds; }
    public void setParticipantsIds(List<String> participantsIds) { this.participantsIds = participantsIds; }

    public String getStudyType() { return studyType; }
    public void setStudyType(String studyType) { this.studyType = studyType; }

    public String getMedicationRoute() { return medicationRoute; }
    public void setMedicationRoute(String medicationRoute) { this.medicationRoute = medicationRoute; }

    public String getStudyParticipantsCount() { return studyParticipantsCount; }
    public void setStudyParticipantsCount(String studyParticipantsCount) { this.studyParticipantsCount = studyParticipantsCount; }

    public String getRegulatoryCAAE() { return regulatoryCAAE; }
    public void setRegulatoryCAAE(String regulatoryCAAE) { this.regulatoryCAAE = regulatoryCAAE; }

    public String getRegulatoryCenterNumber() { return regulatoryCenterNumber; }
    public void setRegulatoryCenterNumber(String regulatoryCenterNumber) { this.regulatoryCenterNumber = regulatoryCenterNumber; }

    public String getRegulatoryObs() { return regulatoryObs; }
    public void setRegulatoryObs(String regulatoryObs) { this.regulatoryObs = regulatoryObs; }

    public String getRegulatorySusarPlatform() { return regulatorySusarPlatform; }
    public void setRegulatorySusarPlatform(String regulatorySusarPlatform) { this.regulatorySusarPlatform = regulatorySusarPlatform; }

    public String getFeasibilityReceptionDate() { return feasibilityReceptionDate; }
    public void setFeasibilityReceptionDate(String feasibilityReceptionDate) { this.feasibilityReceptionDate = feasibilityReceptionDate; }

    public String getFeasibilitySigningDate() { return feasibilitySigningDate; }
    public void setFeasibilitySigningDate(String feasibilitySigningDate) { this.feasibilitySigningDate = feasibilitySigningDate; }

    public String getCenterSelectionNoticeDate() { return centerSelectionNoticeDate; }
    public void setCenterSelectionNoticeDate(String centerSelectionNoticeDate) { this.centerSelectionNoticeDate = centerSelectionNoticeDate; }

    public String getContractReceptionDate() { return contractReceptionDate; }
    public void setContractReceptionDate(String contractReceptionDate) { this.contractReceptionDate = contractReceptionDate; }

    public String getContractSigningDate() { return contractSigningDate; }
    public void setContractSigningDate(String contractSigningDate) { this.contractSigningDate = contractSigningDate; }

    public String getInitialDossierReceptionDate() { return initialDossierReceptionDate; }
    public void setInitialDossierReceptionDate(String initialDossierReceptionDate) { this.initialDossierReceptionDate = initialDossierReceptionDate; }

    public String getInitialDossierSubmissionDate() { return initialDossierSubmissionDate; }
    public void setInitialDossierSubmissionDate(String initialDossierSubmissionDate) { this.initialDossierSubmissionDate = initialDossierSubmissionDate; }

    public String getCepAcceptanceDate() { return cepAcceptanceDate; }
    public void setCepAcceptanceDate(String cepAcceptanceDate) { this.cepAcceptanceDate = cepAcceptanceDate; }

    public String getInitialOpinionApprovalDate() { return initialOpinionApprovalDate; }
    public void setInitialOpinionApprovalDate(String initialOpinionApprovalDate) { this.initialOpinionApprovalDate = initialOpinionApprovalDate; }

    public String getCenterActivationDate() { return centerActivationDate; }
    public void setCenterActivationDate(String centerActivationDate) { this.centerActivationDate = centerActivationDate; }

    public String getFirstParticipantDate() { return firstParticipantDate; }
    public void setFirstParticipantDate(String firstParticipantDate) { this.firstParticipantDate = firstParticipantDate; }

    public String getFirstRandomizedDate() { return firstRandomizedDate; }
    public void setFirstRandomizedDate(String firstRandomizedDate) { this.firstRandomizedDate = firstRandomizedDate; }

    public String getFinalOpinionDate() { return finalOpinionDate; }
    public void setFinalOpinionDate(String finalOpinionDate) { this.finalOpinionDate = finalOpinionDate; }
}
