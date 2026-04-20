package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "kit_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KitHistoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime date;
    private String action; // 'Entrada', 'Saída', 'Criação', 'Ajuste'
    private Integer amount;
    private Integer balance;
}
