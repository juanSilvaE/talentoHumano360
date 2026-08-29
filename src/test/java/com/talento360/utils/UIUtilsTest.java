package com.talento360.utils;

import com.talento360.models.AdministrativeRequest;
import com.talento360.models.Employee;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class UIUtilsTest {

    @Test
    void formatNumber() {
        assertEquals("1.000", UIUtils.format(1000));
        assertEquals("1.234.567", UIUtils.format(1234567));
        assertEquals("0", UIUtils.format(0));
        assertEquals("-500", UIUtils.format(-500));
    }

    @Test
    void upperUiNormalizes() {
        assertEquals("JUAN PEREZ", UIUtils.upperUi("juan perez"));
        assertEquals("MARIA DEL CARMEN", UIUtils.upperUi("  maria   del   carmen  "));
        assertEquals("", UIUtils.upperUi(null));
        assertEquals("", UIUtils.upperUi(""));
    }

    @Test
    void lowerUiNormalizes() {
        assertEquals("juan perez", UIUtils.lowerUi("JUAN PEREZ"));
        assertEquals("ana lopez", UIUtils.lowerUi("  Ana   Lopez  "));
        assertEquals("", UIUtils.lowerUi(""));
        assertEquals("", UIUtils.lowerUi(null));
    }

    @Test
    void valueWithEmployee() {
        Employee e = new Employee("1", "123", "Pedro", "RH", "Jefe", "Jefe",
                "pedro@test.com", "300", "Activo", "01/01/2020", "M");
        assertEquals("Pedro", UIUtils.value(e, Employee::getFullName));
        assertEquals("pedro@test.com", UIUtils.value(e, Employee::getEmail));

        Employee empty = new Employee("1", "123", "", "", "", "", "", "", "", "", "");
        assertEquals("No registrado", UIUtils.value(empty, Employee::getFullName));

        assertEquals("No registrado", UIUtils.value(null, Employee::getFullName));
    }

    @Test
    void formatUiDateNullReturnsEmpty() {
        assertEquals("", UIUtils.formatUiDate(null));
    }

    @Test
    void formatUiDateFormatsCorrectly() {
        LocalDate date = LocalDate.of(2026, 6, 15);
        assertEquals("15/06/2026", UIUtils.formatUiDate(date));
    }

    @Test
    void parseUiDateHandlesMultipleFormats() {
        assertEquals(LocalDate.of(2026, 6, 15), UIUtils.parseUiDate("15/06/2026"));
        assertEquals(LocalDate.of(2026, 6, 5), UIUtils.parseUiDate("5/6/2026"));
        assertEquals(LocalDate.of(2026, 6, 15), UIUtils.parseUiDate("2026-06-15"));
    }

    @Test
    void parseUiDateNullBlankReturnsNull() {
        assertNull(UIUtils.parseUiDate(null));
        assertNull(UIUtils.parseUiDate(""));
        assertNull(UIUtils.parseUiDate("  "));
    }

    @Test
    void defaultDaysForType() {
        assertEquals("15", UIUtils.defaultDaysForType("Vacaciones"));
        assertEquals("15", UIUtils.defaultDaysForType("vacaciones"));
        assertEquals("15", UIUtils.defaultDaysForType("VACACIONES"));
        assertEquals("126", UIUtils.defaultDaysForType("Licencia maternidad"));
        assertEquals("1", UIUtils.defaultDaysForType("Permiso"));
        assertEquals("3", UIUtils.defaultDaysForType("Incapacidad"));
        assertEquals("15", UIUtils.defaultDaysForType("Otro"));
        assertEquals("15", UIUtils.defaultDaysForType(null));
    }

    @Test
    void parsePositiveDays() {
        assertEquals(15, UIUtils.parsePositiveDays("15"));
        assertEquals(3, UIUtils.parsePositiveDays("3"));
        assertEquals(1, UIUtils.parsePositiveDays("1"));
        assertEquals(-1, UIUtils.parsePositiveDays("0"));
        assertEquals(-1, UIUtils.parsePositiveDays("-5"));
        assertEquals(-1, UIUtils.parsePositiveDays("abc"));
        assertEquals(-1, UIUtils.parsePositiveDays(""));
        assertEquals(-1, UIUtils.parsePositiveDays(null));
    }

    @Test
    void normalizeLookup() {
        assertEquals("juan perez", UIUtils.normalizeLookup("  Juan   Perez  "));
        assertEquals("", UIUtils.normalizeLookup(null));
    }

    @Test
    void containsSearch() {
        assertTrue(UIUtils.containsSearch("Juan Perez", "juan"));
        assertTrue(UIUtils.containsSearch("Juan Perez", "perez"));
        assertFalse(UIUtils.containsSearch("Juan Perez", "Carlos"));
        assertTrue(UIUtils.containsSearch("", ""));
    }

    @Test
    void matchesComboFilter() {
        assertTrue(UIUtils.matchesComboFilter("Activo", "Todos", "Todos"));
        assertTrue(UIUtils.matchesComboFilter("Activo", "Activo", "Todos"));
        assertTrue(UIUtils.matchesComboFilter("Inactivo", "Activo", "Todos"));
        assertTrue(UIUtils.matchesComboFilter(null, "Todos", "Todos"));
    }

    @Test
    void matchesDateRange() {
        AdministrativeRequest r = new AdministrativeRequest(1, "RH", "Test", "123", "Cargo",
                "15/06/2026", "5", "1", "", "Vacaciones", "", "01/06/2026");

        assertTrue(UIUtils.matchesDateRange(r, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)));
        assertTrue(UIUtils.matchesDateRange(r, LocalDate.of(2026, 6, 15), LocalDate.of(2026, 6, 15)));
        assertFalse(UIUtils.matchesDateRange(r, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31)));
        assertTrue(UIUtils.matchesDateRange(r, null, null));
        assertTrue(UIUtils.matchesDateRange(r, LocalDate.of(2026, 6, 1), null));
        assertTrue(UIUtils.matchesDateRange(r, null, LocalDate.of(2026, 6, 30)));
    }

    @Test
    void isFemaleRequest() {
        assertTrue(UIUtils.isFemaleRequest(new AdministrativeRequest(1, "RH", "Ana Lopez Femenino",
                "123", "Jefe", "01/06/2026", "5", "1", "", "Vacaciones")));

        assertTrue(UIUtils.isFemaleRequest(new AdministrativeRequest(2, "Sistemas", "Juan Perez",
                "456", "Analista", "01/06/2026", "5", "1", "femenino", "Vacaciones")));

        assertTrue(UIUtils.isFemaleRequest(new AdministrativeRequest(3, "RH", "Maria Mujer",
                "789", "Jefe", "01/06/2026", "5", "1", "", "Vacaciones")));

        assertFalse(UIUtils.isFemaleRequest(new AdministrativeRequest(4, "Sistemas", "Juan Perez",
                "000", "Analista", "01/06/2026", "5", "1", "", "Vacaciones")));
    }

    @Test
    void normalizeRequestStatus() {
        assertEquals("Pendiente", UIUtils.normalizeRequestStatus(null));
        assertEquals("Pendiente", UIUtils.normalizeRequestStatus(""));
        assertEquals("Aprobada", UIUtils.normalizeRequestStatus("aprobada"));
        assertEquals("Aprobada", UIUtils.normalizeRequestStatus("APROBADO"));
        assertEquals("Finalizada", UIUtils.normalizeRequestStatus("finalizada"));
        assertEquals("Finalizada", UIUtils.normalizeRequestStatus("final"));
        assertEquals("Rechazada", UIUtils.normalizeRequestStatus("rechazado"));
        assertEquals("En revisi\u00f3n", UIUtils.normalizeRequestStatus("en revisi\u00f3n"));
        assertEquals("Pendiente", UIUtils.normalizeRequestStatus("desconocido"));
    }

    @Test
    void pageSliceWorks() {
        List<Map<String, String>> rows = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            rows.add(Map.of("id", String.valueOf(i)));
        }
        assertEquals(25, rows.size());

        List<Map<String, String>> page1 = UIUtils.pageSlice(rows, 1, 10);
        assertEquals(10, page1.size());
        assertEquals("0", page1.getFirst().get("id"));

        List<Map<String, String>> page2 = UIUtils.pageSlice(rows, 2, 10);
        assertEquals(10, page2.size());
        assertEquals("10", page2.getFirst().get("id"));

        List<Map<String, String>> page3 = UIUtils.pageSlice(rows, 3, 10);
        assertEquals(5, page3.size());
        assertEquals("20", page3.getFirst().get("id"));
    }

    @Test
    void pageSliceRequests() {
        List<AdministrativeRequest> requests = new ArrayList<>();
        for (int i = 1; i <= 25; i++) {
            requests.add(new AdministrativeRequest(i, "RH", "Test", "123", "Cargo",
                    "01/06/2026", "5", "1", "", "Vacaciones"));
        }
        assertEquals(10, UIUtils.pageSliceRequests(requests, 1, 10).size());
        assertEquals(10, UIUtils.pageSliceRequests(requests, 2, 10).size());
        assertEquals(5, UIUtils.pageSliceRequests(requests, 3, 10).size());
    }
}
