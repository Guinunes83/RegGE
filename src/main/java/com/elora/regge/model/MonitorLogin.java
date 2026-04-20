package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "monitor_logins")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonitorLogin {

    @Id
    private String id;
    
    private String description;
    private String login;
}
