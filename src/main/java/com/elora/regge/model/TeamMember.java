package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "team_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private Boolean active;
    private String sex;
    private String name;
    private String role;
    
    private String email; 
    private String institutionalEmail;
    private String personalEmail;
    
    // Atributos inseridos para sincronizar com o CsvImportService
    private String systemLogin;
    private String systemPassword;
    
    private String cvLattes;
    private String profile;
    private String phone;
    private String cellphone;
    private LocalDate birthDate;
    
    @Column(unique = true)
    private String cpf;
    
    private String license;
    private String rqe;
    private String matricula;
    private LocalDate admissionDate;
    private LocalDate terminationDate;
    private String contractType;
    private String cnpj;
    private LocalDate cvDate;
    private LocalDate gcpDate;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "team_member_id")
    private List<PlatformAccess> platforms;
}