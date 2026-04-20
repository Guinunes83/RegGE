package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "sponsors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sponsor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String alternativeName;
    private String currency;
    private String cro;
    
    @Column(unique = true)
    private String cnpj;
    
    @Column(columnDefinition = "TEXT")
    private String address;

    private Boolean active = true;
}
