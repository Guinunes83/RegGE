package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "associates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Associate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String status; // Ativo, Inativo, Recadastro
    private LocalDate memberSince;
    private LocalDate exitRequestDate;
    
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String observations;
    
    private LocalDate birthDate;
    
    @Column(unique = true)
    private String cpf;
    
    private String associateType;
    private String email;
    private String naturalness;
    private String nationality;
    
    private String address;
    private String addressComplement;
    private String city;
    private String neighborhood;
    private String state;
    private String bond;
    private String cep;
    
    private String phone1;
    private String phone2;
    private String role;
    
    private Integer dueDay;
    
    @Column(columnDefinition = "TEXT")
    private String reRegistrationsJson;
    
    @Column(columnDefinition = "TEXT")
    private String paymentsJson;
}
