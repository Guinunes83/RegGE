package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "team_member_platforms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlatformAccess {

    @Id
    private String id;
    
    private String name;
    private String login;
    private String password;
    
    @Column(columnDefinition = "TEXT")
    private String link;
}
