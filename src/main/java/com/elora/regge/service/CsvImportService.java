package com.elora.regge.service;

import com.elora.regge.model.Study;
import com.elora.regge.model.TeamMember;
import com.elora.regge.model.Patient;
import com.elora.regge.repository.StudyRepository;
import com.elora.regge.repository.TeamMemberRepository;
import com.elora.regge.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CsvImportService {

    @Autowired
    private StudyRepository studyRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private PatientRepository patientRepository;

    private String safeGet(String[] data, int index) {
        if (index >= data.length) return null;
        String val = data[index].replace("\"", "").trim();
        return val.isEmpty() ? null : val;
    }

    private LocalDate safeGetDate(String[] data, int index) {
        String val = safeGet(data, index);
        if (val == null) return null;
        try {
            return LocalDate.parse(val, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception e) {
            try { return LocalDate.parse(val); } catch (Exception ex) { return null; }
        }
    }

    private Boolean safeGetBoolean(String[] data, int index) {
        String val = safeGet(data, index);
        if (val == null) return null;
        return val.equalsIgnoreCase("true") || val.equalsIgnoreCase("sim") || val.equalsIgnoreCase("1") || val.equalsIgnoreCase("yes");
    }

    public int importStudies(MultipartFile file) throws Exception {
        List<Study> studies = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String headerLine = br.readLine();
            if (headerLine == null) throw new Exception("Arquivo CSV vazio.");

            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] data = line.split("[,;](?=([^\"]*\"[^\"]*\")*[^\"]*$)");
                if (data.length < 1) continue;
                Study study = new Study();
                // Ordem esperada: name, alternativeName, coordinatorCenter, protocol, sponsor, pi, cro, coordinator, pathology, recruitment, centerNumber, caae, ciomsDistribution, credentials, status, studyType, medicationRoute, studyParticipantsCount, regulatoryCAAE, regulatoryCenterNumber, regulatoryObs, regulatorySusarPlatform, feasibilityReceptionDate, feasibilitySigningDate, centerSelectionNoticeDate, contractReceptionDate, contractSigningDate, initialDossierReceptionDate, initialDossierSubmissionDate, cepAcceptanceDate, initialOpinionApprovalDate, centerActivationDate, firstParticipantDate, firstRandomizedDate, finalOpinionDate
                study.setName(safeGet(data, 0));
                study.setAlternativeName(safeGet(data, 1));
                study.setCoordinatorCenter(safeGet(data, 2));
                study.setProtocol(safeGet(data, 3));
                study.setSponsor(safeGet(data, 4));
                study.setPi(safeGet(data, 5));
                study.setCro(safeGet(data, 6));
                study.setCoordinator(safeGet(data, 7));
                study.setPathology(safeGet(data, 8));
                study.setRecruitment(safeGet(data, 9));
                study.setCenterNumber(safeGet(data, 10));
                study.setCaae(safeGet(data, 11));
                study.setCiomsDistribution(safeGet(data, 12));
                study.setCredentials(safeGet(data, 13));
                study.setStatus(safeGet(data, 14));
                study.setStudyType(safeGet(data, 15));
                study.setMedicationRoute(safeGet(data, 16));
                study.setStudyParticipantsCount(safeGet(data, 17));
                study.setRegulatoryCAAE(safeGet(data, 18));
                study.setRegulatoryCenterNumber(safeGet(data, 19));
                study.setRegulatoryObs(safeGet(data, 20));
                study.setRegulatorySusarPlatform(safeGet(data, 21));
                study.setFeasibilityReceptionDate(safeGet(data, 22));
                study.setFeasibilitySigningDate(safeGet(data, 23));
                study.setCenterSelectionNoticeDate(safeGet(data, 24));
                study.setContractReceptionDate(safeGet(data, 25));
                study.setContractSigningDate(safeGet(data, 26));
                study.setInitialDossierReceptionDate(safeGet(data, 27));
                study.setInitialDossierSubmissionDate(safeGet(data, 28));
                study.setCepAcceptanceDate(safeGet(data, 29));
                study.setInitialOpinionApprovalDate(safeGet(data, 30));
                study.setCenterActivationDate(safeGet(data, 31));
                study.setFirstParticipantDate(safeGet(data, 32));
                study.setFirstRandomizedDate(safeGet(data, 33));
                study.setFinalOpinionDate(safeGet(data, 34));
                studies.add(study);
            }
        }
        studyRepository.saveAll(studies);
        return studies.size();
    }

    public int importTeam(MultipartFile file) throws Exception {
        List<TeamMember> teamMembers = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String headerLine = br.readLine();
            if (headerLine == null) throw new Exception("Arquivo CSV vazio.");

            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] data = line.split("[,;](?=([^\"]*\"[^\"]*\")*[^\"]*$)");
                if (data.length < 1) continue;
                TeamMember member = new TeamMember();
                // Ordem esperada: active, honorific, name, role, email, profile, phone, cellphone, birthDate, cpf, license, rqe, matricula, admissionDate, terminationDate, contractType, cnpj, cvDate, gcpDate
                member.setActive(safeGetBoolean(data, 0));
                member.setHonorific(safeGet(data, 1));
                member.setName(safeGet(data, 2));
                member.setRole(safeGet(data, 3));
                member.setEmail(safeGet(data, 4));
                member.setProfile(safeGet(data, 5));
                member.setPhone(safeGet(data, 6));
                member.setCellphone(safeGet(data, 7));
                member.setBirthDate(safeGetDate(data, 8));
                member.setCpf(safeGet(data, 9));
                member.setLicense(safeGet(data, 10));
                member.setRqe(safeGet(data, 11));
                member.setMatricula(safeGet(data, 12));
                member.setAdmissionDate(safeGetDate(data, 13));
                member.setTerminationDate(safeGetDate(data, 14));
                member.setContractType(safeGet(data, 15));
                member.setCnpj(safeGet(data, 16));
                member.setCvDate(safeGetDate(data, 17));
                member.setGcpDate(safeGetDate(data, 18));
                
                teamMembers.add(member);
            }
        }
        teamMemberRepository.saveAll(teamMembers);
        return teamMembers.size();
    }

    public int importParticipants(MultipartFile file) throws Exception {
        List<Patient> patients = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String headerLine = br.readLine();
            if (headerLine == null) throw new Exception("Arquivo CSV vazio.");

            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] data = line.split("[,;](?=([^\"]*\"[^\"]*\")*[^\"]*$)");
                if (data.length < 1) continue;
                Patient patient = new Patient();
                // Ordem esperada: participantNumber, screeningNumber, name, email, birthDate, sex, studyId, treatment, randomization, status, observations, initials, contact, secondaryContact, tcleDate
                patient.setParticipantNumber(safeGet(data, 0));
                patient.setScreeningNumber(safeGet(data, 1));
                patient.setName(safeGet(data, 2));
                patient.setEmail(safeGet(data, 3));
                patient.setBirthDate(safeGetDate(data, 4));
                patient.setSex(safeGet(data, 5));
                patient.setStudyId(safeGet(data, 6));
                patient.setTreatment(safeGet(data, 7));
                patient.setRandomization(safeGet(data, 8));
                patient.setStatus(safeGet(data, 9));
                patient.setObservations(safeGet(data, 10));
                patient.setInitials(safeGet(data, 11));
                patient.setContact(safeGet(data, 12));
                patient.setSecondaryContact(safeGet(data, 13));
                patient.setTcleDate(safeGetDate(data, 14));
                
                patients.add(patient);
            }
        }
        patientRepository.saveAll(patients);
        return patients.size();
    }
}

