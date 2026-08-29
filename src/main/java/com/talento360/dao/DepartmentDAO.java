package com.talento360.dao;

import com.talento360.config.Database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class DepartmentDAO {
    public List<Map<String, String>> list(String filter) {
        List<Map<String, String>> rows = new ArrayList<>();
        String sql = """
                SELECT d.id_dependencia,
                       COALESCE(d.dependencia, '') AS dependencia,
                       COALESCE(d.cargo_directivo, 'DIRECTIVO / COORDINADOR DE AREA') AS cargo,
                       COALESCE(d.responsable, 'RESPONSABLE INSTITUCIONAL') AS nombre,
                       COALESCE(d.correo_responsable, '') AS correo,
                       COALESCE(d.extension_telefonica, '') AS extension,
                       COALESCE(d.funciones, 'Gestion institucional, seguimiento administrativo y apoyo a los procesos de talento humano.') AS funciones
                FROM dependencias d
                ORDER BY d.id_dependencia
                """;

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                Map<String, String> row = new LinkedHashMap<>();
                row.put("Dependencia", clean(rs.getString("dependencia")));
                row.put("Cargo", clean(rs.getString("cargo")));
                row.put("Nombre", clean(rs.getString("nombre")));
                row.put("Correo", departmentEmail(rs.getString("correo"), rs.getString("id_dependencia")));
                row.put("Extension", departmentExtension(rs.getString("extension"), rs.getString("id_dependencia")));
                row.put("Funciones", clean(rs.getString("funciones")));
                row.put("Ciudad", "Tunja, Boyaca");
                row.put("Estado", "Activo");
                rows.add(row);
            }
        } catch (Exception e) {
            System.err.println("Error listing departments: " + e.getMessage());
        }

        if (filter != null && !filter.isBlank()) {
            String f = filter.toLowerCase(Locale.ROOT);
            rows = rows.stream()
                    .filter(r -> r.values().stream().anyMatch(v -> v != null && v.toLowerCase(Locale.ROOT).contains(f)))
                    .toList();
        }
        return rows;
    }

    public List<String> listDepartmentNames() {
        List<String> rows = new ArrayList<>();
        String sql = "SELECT dependencia FROM dependencias ORDER BY dependencia";
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                String value = clean(rs.getString("dependencia"));
                if (!value.isBlank() && !rows.contains(value)) rows.add(value);
            }
        } catch (Exception e) {
            System.err.println("Error listing department catalog: " + e.getMessage());
        }
        return rows;
    }

    public List<String> listJobTitleNames() {
        List<String> rows = new ArrayList<>();
        String sql = "SELECT cargo FROM cargos ORDER BY cargo";
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                String value = clean(rs.getString("cargo"));
                if (!value.isBlank() && !rows.contains(value)) rows.add(value);
            }
        } catch (Exception e) {
            System.err.println("Error listing job-title catalog: " + e.getMessage());
        }
        return rows;
    }

    public boolean create(String name) {
        if (name == null || name.isBlank()) return false;
        String cleanName = clean(name);
        try (Connection conn = Database.getConnection()) {
            if (findDepartmentId(conn, cleanName) != null) return false;
            String id = nextDepartmentId(conn);
            try (PreparedStatement stmt = conn.prepareStatement("INSERT INTO dependencias(id_dependencia, dependencia) VALUES (?, ?)")) {
                stmt.setString(1, id);
                stmt.setString(2, cleanName);
                return stmt.executeUpdate() > 0;
            }
        } catch (Exception e) {
            System.err.println("Error creating department: " + e.getMessage());
            return false;
        }
    }

    /**
     * Crea una dependencia con todos los detalles (responsable, cargo, correo, etc.)
     */
    public boolean createFull(String name, String responsable, String cargo, String correo, String extension, String funciones) {
        if (name == null || name.isBlank()) return false;
        String cleanName = clean(name);
        try (Connection conn = Database.getConnection()) {
            if (findDepartmentId(conn, cleanName) != null) return false;
            String id = nextDepartmentId(conn);
            try (PreparedStatement stmt = conn.prepareStatement(
                    "INSERT INTO dependencias(id_dependencia, dependencia, responsable, cargo_directivo, correo_responsable, extension_telefonica, funciones) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
                stmt.setString(1, id);
                stmt.setString(2, cleanName);
                stmt.setString(3, responsable != null && !responsable.isBlank() ? clean(responsable) : "");
                stmt.setString(4, cargo != null && !cargo.isBlank() ? clean(cargo) : "");
                stmt.setString(5, correo != null && !correo.isBlank() ? correo.trim().toLowerCase() : "");
                stmt.setString(6, extension != null && !extension.isBlank() ? extension.trim() : "");
                stmt.setString(7, funciones != null && !funciones.isBlank() ? funciones.trim() : "");
                return stmt.executeUpdate() > 0;
            }
        } catch (Exception e) {
            System.err.println("Error creating department: " + e.getMessage());
            return false;
        }
    }

    /**
     * Actualiza el nombre de una dependencia existente (busca por nombre actual).
     */
    public boolean update(String currentName, String newName) {
        if (currentName == null || currentName.isBlank() || newName == null || newName.isBlank()) return false;
        String cleanCurrent = clean(currentName);
        String cleanNew = clean(newName);
        try (Connection conn = Database.getConnection()) {
            String id = findDepartmentId(conn, cleanCurrent);
            if (id == null) return false;
            // Evitar duplicados
            if (findDepartmentId(conn, cleanNew) != null && !cleanCurrent.equalsIgnoreCase(cleanNew)) return false;
            try (PreparedStatement stmt = conn.prepareStatement("UPDATE dependencias SET dependencia = ? WHERE id_dependencia = ?")) {
                stmt.setString(1, cleanNew);
                stmt.setString(2, id);
                return stmt.executeUpdate() > 0;
            }
        } catch (Exception e) {
            System.err.println("Error updating department: " + e.getMessage());
            return false;
        }
    }

    /**
     * Actualiza una dependencia con todos los detalles (responsable, cargo, correo, etc.)
     */
    public boolean updateFull(String currentName, String newName, String responsable, String cargo, String correo, String extension, String funciones) {
        if (currentName == null || currentName.isBlank() || newName == null || newName.isBlank()) return false;
        String cleanCurrent = clean(currentName);
        String cleanNew = clean(newName);
        try (Connection conn = Database.getConnection()) {
            String id = findDepartmentId(conn, cleanCurrent);
            if (id == null) return false;
            // Evitar duplicados
            if (findDepartmentId(conn, cleanNew) != null && !cleanCurrent.equalsIgnoreCase(cleanNew)) return false;
            try (PreparedStatement stmt = conn.prepareStatement(
                    "UPDATE dependencias SET dependencia = ?, responsable = ?, cargo_directivo = ?, correo_responsable = ?, extension_telefonica = ?, funciones = ? WHERE id_dependencia = ?")) {
                stmt.setString(1, cleanNew);
                stmt.setString(2, responsable != null && !responsable.isBlank() ? clean(responsable) : "");
                stmt.setString(3, cargo != null && !cargo.isBlank() ? clean(cargo) : "");
                stmt.setString(4, correo != null && !correo.isBlank() ? correo.trim().toLowerCase() : "");
                stmt.setString(5, extension != null && !extension.isBlank() ? extension.trim() : "");
                stmt.setString(6, funciones != null && !funciones.isBlank() ? funciones.trim() : "");
                stmt.setString(7, id);
                return stmt.executeUpdate() > 0;
            }
        } catch (Exception e) {
            System.err.println("Error updating department: " + e.getMessage());
            return false;
        }
    }

    /**
     * Obtiene todos los datos de una dependencia por su nombre
     */
    public Map<String, String> getDepartmentData(String name) {
        if (name == null || name.isBlank()) return new LinkedHashMap<>();
        String cleanName = clean(name);
        String sql = """
                SELECT dependencia, responsable, cargo_directivo, correo_responsable, extension_telefonica, funciones
                FROM dependencias
                WHERE LOWER(dependencia) = LOWER(?)
                """;
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, cleanName);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, String> data = new LinkedHashMap<>();
                    data.put("dependencia", rs.getString("dependencia"));
                    data.put("responsable", rs.getString("responsable"));
                    data.put("cargo_directivo", rs.getString("cargo_directivo"));
                    data.put("correo_responsable", rs.getString("correo_responsable"));
                    data.put("extension_telefonica", rs.getString("extension_telefonica"));
                    data.put("funciones", rs.getString("funciones"));
                    return data;
                }
            }
        } catch (Exception e) {
            System.err.println("Error getting department data: " + e.getMessage());
        }
        return new LinkedHashMap<>();
    }

    /**
     * Elimina una dependencia por nombre si no tiene registros asociados en rel_principal.
     */
    public boolean delete(String name) {
        if (name == null || name.isBlank()) return false;
        String cleanName = clean(name);
        try (Connection conn = Database.getConnection()) {
            String id = findDepartmentId(conn, cleanName);
            if (id == null) return false;
            // Verificar referencias
            try (PreparedStatement check = conn.prepareStatement("SELECT 1 FROM rel_principal WHERE id_dependencia = ? LIMIT 1")) {
                check.setString(1, id);
                try (ResultSet rs = check.executeQuery()) {
                    if (rs.next()) return false; // en uso
                }
            }
            try (PreparedStatement del = conn.prepareStatement("DELETE FROM dependencias WHERE id_dependencia = ?")) {
                del.setString(1, id);
                return del.executeUpdate() > 0;
            }
        } catch (Exception e) {
            System.err.println("Error deleting department: " + e.getMessage());
            return false;
        }
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) return "NO REGISTRADO";
        return value.trim().replaceAll("\\s+", " ").toUpperCase(new Locale("es", "CO"));
    }

    private String departmentEmail(String value, String id) {
        if (value != null && !value.isBlank()) return value.trim().toLowerCase(Locale.ROOT);
        return "dependencia" + numericId(id) + "@boyaca.gov.co";
    }

    private String departmentExtension(String value, String id) {
        if (value != null && !value.isBlank()) return value.trim();
        return "22" + numericId(id);
    }

    private String numericId(String id) {
        String digits = id == null ? "" : id.replaceAll("\\D", "");
        if (digits.isBlank()) return "00";
        return digits.length() >= 2 ? digits.substring(digits.length() - 2) : "0" + digits;
    }

    private String findDepartmentId(Connection conn, String name) throws Exception {
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id_dependencia FROM dependencias WHERE LOWER(dependencia) = LOWER(?) LIMIT 1")) {
            stmt.setString(1, name);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private String nextDepartmentId(Connection conn) throws Exception {
        int max = 0;
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id_dependencia FROM dependencias")) {
            while (rs.next()) {
                String digits = rs.getString(1) == null ? "" : rs.getString(1).replaceAll("\\D", "");
                if (!digits.isBlank()) max = Math.max(max, Integer.parseInt(digits));
            }
        }
        return "DEP" + String.format("%03d", max + 1);
    }

}
