package com.talento360.models;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AdministrativeRequestTest {

    @Test
    void threeArgConstructorDefaults() {
        AdministrativeRequest r = new AdministrativeRequest(1, "Sistemas", "Ana Lopez",
                "54321", "Analista", "01/06/2026", "10", "1",
                "Nota", "Vacaciones");

        assertEquals(1, r.getRequestId());
        assertEquals("Sistemas", r.getDepartment());
        assertEquals("Ana Lopez", r.getPerson());
        assertEquals("54321", r.getDocument());
        assertEquals("Analista", r.getJobTitle());
        assertEquals("01/06/2026", r.getStartDate());
        assertEquals("10", r.getTotalDays());
        assertEquals("1", r.getPeriods());
        assertEquals("Nota", r.getNotes());
        assertEquals("Vacaciones", r.getRequestType());
        assertEquals("", r.getStatus());
        assertEquals("", r.getRequestDate());
    }

    @Test
    void fourArgConstructorSetsStatus() {
        AdministrativeRequest r = new AdministrativeRequest(2, "RH", "Carlos Mera",
                "111", "Jefe", "01/07/2026", "5", "1",
                "Nota", "Permiso", "Pendiente");

        assertEquals("Pendiente", r.getStatus());
        assertEquals("", r.getRequestDate());
    }

    @Test
    void fullConstructorSetsRequestDate() {
        AdministrativeRequest r = new AdministrativeRequest(3, "RH", "Luis Paz",
                "222", "Auxiliar", "15/07/2026", "3", "1",
                "Urgente", "Incapacidad", "Aprobada", "10/07/2026");

        assertEquals("Aprobada", r.getStatus());
        assertEquals("10/07/2026", r.getRequestDate());
    }

    @Test
    void setStatusUpdatesValue() {
        AdministrativeRequest r = new AdministrativeRequest(1, "Sistemas", "Test",
                "000", "Test", "01/01/2026", "1", "1",
                "", "Vacaciones");

        assertEquals("", r.getStatus());
        r.setStatus("Rechazada");
        assertEquals("Rechazada", r.getStatus());
    }
}
