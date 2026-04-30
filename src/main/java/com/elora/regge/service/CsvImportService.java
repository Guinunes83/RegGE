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

    public int importStudies(MultipartFile file) throws Exception {
        List<Study> studies = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String headerLine = br.readLine(); // Ignore header
            if (headerLine == null) throw new Exception("Arquivo CSV vazio.");

            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] data = line.split("[,;](?=([^\"]*\"[^\"]*\")*[^\"]*$)");
                if (data.length < 1) continue;
                Study study = new Study();
                study.setName(data[0].replace("\"", "").trim());
                if (data.length > 1) study.setProtocol(data[1].replace("\"", "").trim());
                if (data.length > 2) study.setSponsor(data[2].replace("\"", "").trim());
                if (data.length > 3) study.setStatus(data[3].replace("\"", "").trim());
                study.setActive(true);
                // Adicionar outras propriedades conforme o CSV
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
                member.setName(data[0].replace("\"", "").trim());
                if (data.length > 1) member.setRole(data[1].replace("\"", "").trim());
                if (data.length > 2) member.setEmail(data[2].replace("\"", "").trim());
                if (data.length > 3) member.setCpf(data[3].replace("\"", "").trim());
                member.setActive(true);
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
                patient.setName(data[0].replace("\"", "").trim());
                if (data.length > 1) patient.setParticipantNumber(data[1].replace("\"", "").trim());
                if (data.length > 2) patient.setStudyId(data[2].replace("\"", "").trim());
                if (data.length > 3) patient.setStatus(data[3].replace("\"", "").trim());
                patients.add(patient);
            }
        }
        patientRepository.saveAll(patients);
        return patients.size();
    }
}
