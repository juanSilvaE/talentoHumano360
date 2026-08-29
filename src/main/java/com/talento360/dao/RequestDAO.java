package com.talento360.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.talento360.config.Database;
import com.talento360.models.AdministrativeRequest;

public class RequestDAO {
    private static final DateTimeFormatter UI_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public List<AdministrativeRequest> list(String filter) {
        List<AdministrativeRequest> items = new ArrayList<>();
        boolean hasFilter = filter != null && !filter.isBlank();
        String sql = """
                SELECT id_vacacion,
                       COALESCE(dependencia, '') AS dependencia,
                       COALESCE(apellidos_nombres, '') AS persona,
                       COALESCE(documento, '') AS documento,
                       COALESCE(cargo, '') AS cargo,
                       COALESCE(fecha_ingreso, '') AS fecha_ingreso,
                       COALESCE(dias_totales, '') AS dias_totales,
                       COALESCE(periodos, '') AS periodos,
                       COALESCE(observaciones, '') AS observaciones,
                       COALESCE(tipo_vinculacion, '') AS tipo_vinculacion,
                       COALESCE(estado, '') AS estado,
                       COALESCE(hoy, '') AS fecha_solicitud
                FROM vacaciones
                """;
        if (hasFilter) {
            sql += " WHERE LOWER(apellidos_nombres) LIKE LOWER(?) OR documento LIKE ? OR LOWER(dependencia) LIKE LOWER(?) ";
        }
        sql += " ORDER BY id_vacacion DESC";

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (hasFilter) {
                String like = "%" + filter.trim() + "%";
                stmt.setString(1, like);
                stmt.setString(2, like);
                stmt.setString(3, like);
            }
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                items.add(new AdministrativeRequest(
                        rs.getInt("id_vacacion"),
                        upper(rs.getString("dependencia")),
                        nameOrder(rs.getString("persona")),
                        rs.getString("documento"),
                        upper(rs.getString("cargo")),
                        rs.getString("fecha_ingreso"),
                        rs.getString("dias_totales"),
                        rs.getString("periodos"),
                        rs.getString("observaciones"),
                        rs.getString("tipo_vinculacion"),
                        normalizeStatus(rs.getString("estado")),
                        rs.getString("fecha_solicitud")
                ));
            }
        } catch (Exception e) {
            System.err.println("Error listing requests: " + e.getMessage());
        }


        if (hasFilter) {
            String f = filter.toLowerCase(Locale.ROOT);
            items = items.stream()
                    .filter(v -> contains(v.getPerson(), f) || contains(v.getDocument(), f) || contains(v.getDepartment(), f) || contains(v.getJobTitle(), f))
                    .toList();
        }
        return items;
    }

    public boolean create(AdministrativeRequest v) {
        return createReturningId(v) > 0;
    }

    public int createReturningId(AdministrativeRequest v) {
        String sql = """
                INSERT INTO vacaciones(dependencia, numero, apellidos_nombres, titular_cargo, genero,
                                        documento, fecha_ingreso, cargo, codigo, grado, sueldo, gastos_rep,
                                        fecha_corte, hoy, dias_totales, anos, meses, periodos,
                                        observaciones, tipo_vinculacion, estado, revision_planta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            String jobTitle = upper(v.getJobTitle());
            String numero = "SOL-APP-" + Math.abs((int)(System.currentTimeMillis() % 100000));
            String today = LocalDate.now().format(UI_DATE);

            stmt.setString(1, upper(v.getDepartment()));
            stmt.setString(2, numero);
            stmt.setString(3, nameOrder(v.getPerson()));
            stmt.setString(4, jobTitle.isBlank() ? "NO REGISTRADO" : jobTitle);
            stmt.setString(5, "NO REGISTRADO");
            stmt.setString(6, v.getDocument());
            stmt.setString(7, blankTo(v.getStartDate(), "NO REGISTRADO"));
            stmt.setString(8, jobTitle.isBlank() ? "NO REGISTRADO" : jobTitle);
            stmt.setString(9, "N/A");
            stmt.setString(10, "N/A");
            stmt.setString(11, "$0");
            stmt.setString(12, "$0");
            stmt.setString(13, today);
            stmt.setString(14, today);
            stmt.setString(15, blankTo(v.getTotalDays(), "0"));
            stmt.setString(16, "0");
            stmt.setString(17, "0");
            stmt.setString(18, blankTo(v.getPeriods(), "Periodo actual"));
            stmt.setString(19, blankTo(v.getNotes(), "Creado desde interfaz"));
            stmt.setString(20, blankTo(v.getRequestType(), "Vacaciones"));
            stmt.setString(21, normalizeStatus(v.getStatus()));
            stmt.setString(22, "Creado desde interfaz JavaFX");
            if (stmt.executeUpdate() == 0) return -1;
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
            return -1;
        } catch (Exception e) {
            System.err.println("Error creating request: " + e.getMessage());
            return -1;
        }
    }

    private String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    public boolean updateStatus(int requestId, String newStatus) {
        return updateStatus(requestId, newStatus, "Cambio realizado desde la interfaz");
    }

    public boolean update(AdministrativeRequest request, String note) {
        if (request == null || request.getRequestId() <= 0) return false;
        String sql = """
                UPDATE vacaciones
                SET dependencia = ?,
                    apellidos_nombres = ?,
                    documento = ?,
                    fecha_ingreso = ?,
                    cargo = ?,
                    titular_cargo = ?,
                    dias_totales = ?,
                    periodos = ?,
                    observaciones = ?,
                    tipo_vinculacion = ?,
                    estado = ?,
                    revision_planta = ?
                WHERE id_vacacion = ?
                """;
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            String jobTitle = upper(request.getJobTitle());
            String status = normalizeStatus(request.getStatus());
            stmt.setString(1, upper(request.getDepartment()));
            stmt.setString(2, nameOrder(request.getPerson()));
            stmt.setString(3, blankTo(request.getDocument(), "NO REGISTRADO"));
            stmt.setString(4, blankTo(request.getStartDate(), "NO REGISTRADO"));
            stmt.setString(5, jobTitle.isBlank() ? "NO REGISTRADO" : jobTitle);
            stmt.setString(6, jobTitle.isBlank() ? "NO REGISTRADO" : jobTitle);
            stmt.setString(7, blankTo(request.getTotalDays(), "0"));
            stmt.setString(8, blankTo(request.getPeriods(), "Periodo actual"));
            stmt.setString(9, blankTo(request.getNotes(), "Actualizado desde interfaz"));
            stmt.setString(10, blankTo(request.getRequestType(), "Vacaciones"));
            stmt.setString(11, status);
            stmt.setString(12, blankTo(note, "Actualizado desde interfaz JavaFX"));
            stmt.setInt(13, request.getRequestId());
            boolean updated = stmt.executeUpdate() > 0;
            if (updated) recordHistory(conn, request.getRequestId(), status, note);
            return updated;
        } catch (Exception e) {
            System.err.println("Error updating request: " + e.getMessage());
            return false;
        }
    }

    public boolean updateStatus(int requestId, String newStatus, String note) {
        if (requestId <= 0) return false;
        String status = normalizeStatus(newStatus);
        String sql = "UPDATE vacaciones SET estado = ? WHERE id_vacacion = ?";
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setInt(2, requestId);
            boolean updated = stmt.executeUpdate() > 0;
            if (updated) recordHistory(conn, requestId, status, note);
            return updated;
        } catch (Exception e) {
            System.err.println("Error updating request status: " + e.getMessage());
            return false;
        }
    }

    public boolean delete(int requestId) {
        if (requestId <= 0) return false;
        try (Connection conn = Database.getConnection()) {
            deleteHistoryIfExists(conn, requestId);
            try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM vacaciones WHERE id_vacacion = ?")) {
                stmt.setInt(1, requestId);
                return stmt.executeUpdate() > 0;
            }
        } catch (Exception e) {
            System.err.println("Error deleting request: " + e.getMessage());
            return false;
        }
    }

    private void deleteHistoryIfExists(Connection conn, int requestId) {
        try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM historial_solicitudes WHERE id_vacacion = ?")) {
            stmt.setInt(1, requestId);
            stmt.executeUpdate();
        } catch (Exception ignored) {
        }
    }

    private void recordHistory(Connection conn, int requestId, String status, String note) {
        String sql = """
                INSERT INTO historial_solicitudes(id_vacacion, estado_nuevo, nota, actualizado_por)
                VALUES (?, ?, ?, ?)
                """;
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, requestId);
            stmt.setString(2, status);
            stmt.setString(3, blankTo(note, "Cambio realizado desde la interfaz"));
            stmt.setString(4, "interfaz_javafx");
            stmt.executeUpdate();
        } catch (Exception ignored) {
        }
    }

    private boolean contains(String value, String filter) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(filter);
    }

    private String upper(String value) {
        if (value == null) return "";
        return value.trim().replaceAll("\\s+", " ").toUpperCase(new Locale("es", "CO"));
    }

    private String nameOrder(String value) {
        return upper(value);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "Pendiente";
        String e = status.trim().toLowerCase(Locale.ROOT);
        return switch (e) {
            case "aprobada", "aprobado" -> "Aprobada";
            case "finalizada", "finalizado" -> "Finalizada";
            case "rechazada", "rechazado" -> "Rechazada";
            case "en revisión", "en revision", "revision" -> "En revisión";
            default -> "Pendiente";
        };
    }

}
