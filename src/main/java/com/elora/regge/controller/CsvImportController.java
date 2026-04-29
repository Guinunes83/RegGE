package com.elora.regge.controller;

import com.elora.regge.service.CsvImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "*")
public class CsvImportController {

    @Autowired
    private CsvImportService csvImportService;

    @PostMapping("/{entityType}")
    public ResponseEntity<Map<String, String>> importCsv(
            @PathVariable String entityType,
            @RequestParam("file") MultipartFile file) {
        
        Map<String, String> response = new HashMap<>();

        if (file.isEmpty()) {
            response.put("error", "O arquivo CSV enviado está vazio.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        try {
            switch (entityType.toLowerCase()) {
                case "studies":
                    csvImportService.importStudies(file);
                    response.put("message", "Estudos importados com sucesso.");
                    break;
                case "team":
                    csvImportService.importTeam(file);
                    response.put("message", "Membros da equipe importados com sucesso.");
                    break;
                case "participants":
                    csvImportService.importParticipants(file);
                    response.put("message", "Participantes importados com sucesso.");
                    break;
                default:
                    response.put("error", "Tipo de entidade desconhecido: " + entityType);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Falha ao importar o arquivo CSV: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
