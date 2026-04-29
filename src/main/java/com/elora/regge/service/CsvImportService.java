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

    public void importStudies(MultipartFile file) throws Exception {
        List<Study> studies = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String headerLine = br.readLine(); // Ignore header
            if (headerLine == null) throw new Exception("Arquivo CSV vazio.");

            while ((line = br.readLine()) != null) {
                String[] data = line.split(";"); // adjust delimiter if necessary
                if (data.length < 2) continue; // Skip invalid lines
                Study study = new Study();
                study.setName(data[0].trim());
                study.setProtocol(data[1].trim());
                if (data.length > 2) study.setSponsor(data[2].trim());
                if (data.length > 3) study.setStatus(data[3].trim());
                // Adicionar outras propriedades conforme o CSV
                studies.add(study);
            }
        }
        studyRepository.saveAll(studies);
    }

    public void importTeam(MultipartFile file) throws Exception {
        List<TeamMember> teamMembers = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String headerLine = br.readLine();
            if (headerLine == null) throw new Exception("Arquivo CSV vazio.");

            while ((line = br.readLine()) != null) {
                String[] data = line.split(";");
                if (data.length < 2) continue;
                TeamMember member = new TeamMember();
                member.setName(data[0].trim());
                member.setRole(data[1].trim());
                if (data.length > 2) member.setEmail(data[2].trim());
                if (data.length > 3) member.setCpf(data[3].trim());
                teamMembers.add(member);
            }
        }
        teamMemberRepository.saveAll(teamMembers);
    }

    public void importParticipants(MultipartFile file) throws Exception {
        List<Patient> patients = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            String headerLine = br.readLine();
            if (headerLine == null) throw new Exception("Arquivo CSV vazio.");

            while ((line = br.readLine()) != null) {
                String[] data = line.split(";");
                if (data.length < 2) continue;
                Patient patient = new Patient();
                patient.setName(data[0].trim());
                patient.setParticipantNumber(data[1].trim());
                if (data.length > 2) patient.setStudyId(data[2].trim());
                if (data.length > 3) patient.setStatus(data[3].trim());
                patients.add(patient);
            }
        }
        patientRepository.saveAll(patients);
    }
}
