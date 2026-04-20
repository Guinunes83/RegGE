
package com.elora.regge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReggeApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReggeApplication.class, args);
        System.out.println("🚀 Sistema Regge iniciado com sucesso! Banco de dados SQLite conectado.");
    }
}
