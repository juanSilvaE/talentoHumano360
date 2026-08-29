package com.talento360.services;

import com.talento360.dao.DashboardDAO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private DashboardDAO dashboardDAO;

    private DashboardService service;

    @BeforeEach
    void setUp() {
        service = new DashboardService(dashboardDAO);
    }

    @Test
    void getRequestTypeCountsDelegatesToDAO() {
        Map<String, Integer> expected = Map.of("Vacaciones", 10, "Permiso", 5);
        when(dashboardDAO.countByRequestType()).thenReturn(expected);

        Map<String, Integer> result = service.getRequestTypeCounts();

        assertEquals(expected, result);
        verify(dashboardDAO).countByRequestType();
    }

    @Test
    void getRequestStatusCountsDelegatesToDAO() {
        Map<String, Integer> expected = Map.of("Pendiente", 8, "Aprobada", 7);
        when(dashboardDAO.countByRequestStatus()).thenReturn(expected);

        Map<String, Integer> result = service.getRequestStatusCounts();

        assertEquals(expected, result);
        verify(dashboardDAO).countByRequestStatus();
    }

    @Test
    void totalRequestsSumsAllValues() {
        Map<String, Integer> counts = Map.of("A", 10, "B", 20, "C", 5);
        assertEquals(35, service.totalRequests(counts));
    }

    @Test
    void totalRequestsEmptyReturnsZero() {
        assertEquals(0, service.totalRequests(Map.of()));
    }

    @Test
    void getMaxValueReturnsMax() {
        Map<String, Integer> counts = Map.of("A", 3, "B", 15, "C", 7);
        assertEquals(15, service.getMaxValue(counts));
    }

    @Test
    void getMaxValueEmptyReturnsDefaultFive() {
        assertEquals(5, service.getMaxValue(Map.of()));
    }

    @Test
    void calcUpperBoundRoundsUpToMultipleOf5Plus5() {
        assertEquals(5, service.calcUpperBound(0));
        assertEquals(10, service.calcUpperBound(5));
        assertEquals(15, service.calcUpperBound(10));
        assertEquals(30, service.calcUpperBound(22));
        assertEquals(35, service.calcUpperBound(30));
    }

    @Test
    void calcTickUnitDividesUpperBoundBy5() {
        assertEquals(2, service.calcTickUnit(10));
        assertEquals(3, service.calcTickUnit(15));
        assertEquals(1, service.calcTickUnit(5));
    }

    @Test
    void filterByTypesKeepsSpecifiedTypesOrder() {
        Map<String, Integer> source = new LinkedHashMap<>();
        source.put("Vacaciones", 10);
        source.put("Permiso", 5);
        source.put("Incapacidad", 3);

        Map<String, Integer> result = service.filterByTypes(source, new String[]{"Vacaciones", "Incapacidad"});

        assertEquals(2, result.size());
        assertEquals(10, result.get("Vacaciones"));
        assertEquals(3, result.get("Incapacidad"));
        assertNull(result.get("Permiso"));
    }

    @Test
    void filterByTypesMissingTypeDefaultsToZero() {
        Map<String, Integer> source = Map.of("Vacaciones", 10);
        Map<String, Integer> result = service.filterByTypes(source, new String[]{"Vacaciones", "Permiso"});

        assertEquals(10, result.get("Vacaciones"));
        assertEquals(0, result.get("Permiso"));
    }

    @Test
    void calcUpperBoundAndTickUnitIntegration() {
        Map<String, Integer> counts = Map.of("A", 7, "B", 23, "C", 15);
        int max = service.getMaxValue(counts);
        int upper = service.calcUpperBound(max);
        int tick = service.calcTickUnit(upper);

        assertEquals(23, max);
        assertEquals(30, upper);
        assertEquals(6, tick);
    }
}
