package com.talento360.services;

import com.talento360.dao.DashboardDAO;
import java.util.LinkedHashMap;
import java.util.Map;

public class DashboardService {

    private final DashboardDAO dashboardDAO;

    public DashboardService(DashboardDAO dashboardDAO) {
        this.dashboardDAO = dashboardDAO;
    }

    public Map<String, Integer> getRequestTypeCounts() {
        return dashboardDAO.countByRequestType();
    }

    public Map<String, Integer> getRequestStatusCounts() {
        return dashboardDAO.countByRequestStatus();
    }

    public int totalRequests(Map<String, Integer> typeCounts) {
        return typeCounts.values().stream().mapToInt(Integer::intValue).sum();
    }

    public int getMaxValue(Map<String, Integer> counts) {
        return counts.values().stream().mapToInt(Integer::intValue).max().orElse(5);
    }

    public int calcUpperBound(int maxValue) {
        return (int) (Math.ceil(maxValue / 5.0) * 5) + 5;
    }

    public int calcTickUnit(int upperBound) {
        return Math.max(1, upperBound / 5);
    }

    public Map<String, Integer> filterByTypes(Map<String, Integer> source, String[] types) {
        Map<String, Integer> result = new LinkedHashMap<>();
        for (String t : types) {
            result.put(t, source.getOrDefault(t, 0));
        }
        return result;
    }
}
