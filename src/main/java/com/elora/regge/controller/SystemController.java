package com.elora.regge.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.context.ApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SystemController {

    @Autowired
    private ApplicationContext appContext;

    @PostMapping("/shutdown")
    public void shutdownApp() {
        // Run in a separate thread so the response can be returned to the client
        Thread thread = new Thread(() -> {
            try {
                Thread.sleep(500); // Give time for the HTTP response to be set
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            SpringApplication.exit(appContext, () -> 0);
            System.exit(0);
        });
        thread.setContextClassLoader(getClass().getClassLoader());
        thread.start();
    }
}
