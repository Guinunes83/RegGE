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
public class MonitorEntry {

    @Id
    private String id;

    private String name;
    private String role;
    private String contact;
    private String email;
    private String cro;
    private String studyId;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "monitor_id")
    private List<MonitorLogin> logins;
}
