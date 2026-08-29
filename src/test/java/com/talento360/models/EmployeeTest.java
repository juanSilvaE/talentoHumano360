package com.talento360.models;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EmployeeTest {

    @Test
    void constructorAndGetters() {
        Employee e = new Employee("R001", "12345", "Juan Perez", "Sistemas",
                "Analista", "Analista I", "juan@test.com", "3001234567",
                "Activo", "01/01/2020", "M");

        assertEquals("R001", e.getRecordId());
        assertEquals("12345", e.getDocumentId());
        assertEquals("Juan Perez", e.getFullName());
        assertEquals("Sistemas", e.getDepartment());
        assertEquals("Analista", e.getCurrentJobTitle());
        assertEquals("Analista I", e.getBaseJobTitle());
        assertEquals("juan@test.com", e.getEmail());
        assertEquals("3001234567", e.getPhone());
        assertEquals("Activo", e.getEmploymentStatus());
        assertEquals("01/01/2020", e.getStartDate());
        assertEquals("M", e.getGender());
    }

    @Test
    void nullFields() {
        Employee e = new Employee(null, null, null, null, null, null,
                null, null, null, null, null);

        assertNull(e.getRecordId());
        assertNull(e.getFullName());
        assertNull(e.getEmail());
    }
}
