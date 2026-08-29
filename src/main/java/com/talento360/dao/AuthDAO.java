package com.talento360.dao;

import com.talento360.config.Database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class AuthDAO {
    private String currentUsername;
    private String currentName;
    private String currentRole;
    private String currentJobTitle;
    private String currentDepartment;

    public boolean login(String username, String password) {
        String normalizedUser = username == null ? "" : username.trim().toLowerCase();
        String normalizedPass = password == null ? "" : password.trim();
        String sql = "SELECT username, nombre, rol FROM usuarios WHERE LOWER(username) = ? AND password = ? AND estado = 'ACTIVO'";

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, normalizedUser);
            stmt.setString(2, normalizedPass);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                currentUsername = rs.getString("username");
                currentName = rs.getString("nombre");
                currentRole = rs.getString("rol");
                applyProfileFor(currentUsername, currentRole);
                return true;
            }
        } catch (Throwable e) {
            System.err.println("PostgreSQL login error: " + e.getMessage());
        }
        return false;
    }

    private void applyProfileFor(String username, String role) {
        if (role != null && role.toLowerCase().contains("coordinador")) {
            currentJobTitle = "Coordinador de solicitudes";
            currentDepartment = "Dirección de Talento Humano";
        } else if (role != null && role.toLowerCase().contains("consulta")) {
            currentJobTitle = "Usuario de consulta";
            currentDepartment = "Secretaría General";
        } else {
            currentJobTitle = "Administrador del sistema";
            currentDepartment = "Dirección de Talento Humano";
        }
    }

    public String getCurrentUsername() {
        return currentUsername;
    }

    public String getCurrentName() {
        return currentName;
    }

    public String getCurrentRole() {
        return currentRole;
    }

    public String getCurrentJobTitle() {
        return currentJobTitle;
    }

    public String getCurrentDepartment() {
        return currentDepartment;
    }

    public boolean canEditRequests() {
        return "Administrador".equalsIgnoreCase(currentRole) || currentRole.toLowerCase().contains("coordinador");
    }

    public boolean canCreateRequests() {
        return canEditRequests();
    }
}
