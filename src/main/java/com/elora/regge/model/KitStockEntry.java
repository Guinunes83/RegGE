package com.elora.regge.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "kit_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KitStockEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String studyId;
    private String kitName;
    private LocalDate expirationDate;
    private Integer quantity;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "kit_id")
    private List<KitHistoryEntry> history;
}
