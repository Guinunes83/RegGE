package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "platform_access")
public class PlatformAccess {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    // Construtor que já gera o ID automaticamente
    public PlatformAccess() {
        this.id = UUID.randomUUID().toString();
    }
}