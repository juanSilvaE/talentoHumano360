package com.talento360.dao;

import com.talento360.config.Database;
import com.talento360.models.Employee;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class EmployeeDAO {
    private static final String BASE_QUERY = """
            SELECT r.id_registro,
                   COALESCE(p.cedula, '') AS cedula,
                   COALESCE(p.nombre_completo, '') AS nombre_completo,
                   COALESCE(d.dependencia, '') AS dependencia,
                   COALESCE(ca.cargo, '') AS cargo_actual,
                   COALESCE(cb.cargo, '') AS cargo_base,
                   COALESCE(con.correo_institucional, '') AS correo,
                   COALESCE(con.celular, '') AS celular,
                   COALESCE(e.situacion, '') AS situacion,
                   COALESCE(r.fecha_ingreso, '') AS fecha_ingreso,
                   COALESCE(p.sexo, '') AS sexo
            FROM rel_principal r
            LEFT JOIN personas p ON p.id_persona = r.id_persona
            LEFT JOIN dependencias d ON d.id_dependencia = r.id_dependencia
            LEFT JOIN cargos ca ON ca.id_cargo = r.id_cargo_actual
            LEFT JOIN cargos cb ON cb.id_cargo = r.id_cargo_base
            LEFT JOIN contactos con ON con.id_contacto = r.id_contacto
            LEFT JOIN estados e ON e.id_estado = r.id_estado
            """;

    public List<Employee> list(String filter) {
        List<Employee> items = new ArrayList<>();
        boolean hasFilter = filter != null && !filter.isBlank();
        String sql = BASE_QUERY;

        if (hasFilter) {
            sql += " WHERE LOWER(p.nombre_completo) LIKE LOWER(?) OR p.cedula LIKE ? OR LOWER(d.dependencia) LIKE LOWER(?) OR LOWER(ca.cargo) LIKE LOWER(?) ";
        }
        sql += " ORDER BY p.nombre_completo LIMIT 240";

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (hasFilter) {
                String like = "%" + filter.trim() + "%";
                stmt.setString(1, like);
                stmt.setString(2, like);
                stmt.setString(3, like);
                stmt.setString(4, like);
            }
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                items.add(new Employee(
                        rs.getString("id_registro"),
                        rs.getString("cedula"),
                        clean(rs.getString("nombre_completo")),
                        clean(rs.getString("dependencia")),
                        clean(rs.getString("cargo_actual")),
                        clean(rs.getString("cargo_base")),
                        rs.getString("correo"),
                        rs.getString("celular"),
                        rs.getString("situacion"),
                        rs.getString("fecha_ingreso"),
                        rs.getString("sexo")
                ));
            }
        } catch (Exception e) {
            System.err.println("Error listing employees: " + e.getMessage());
        }


        if (hasFilter) {
            String f = filter.toLowerCase(Locale.ROOT);
            items = items.stream()
                    .filter(s -> contains(s.getFullName(), f) || contains(s.getDocumentId(), f)
                            || contains(s.getDepartment(), f) || contains(s.getCurrentJobTitle(), f))
                    .toList();
        }
        return items;
    }

    public boolean create(Employee employee) {
        if (employee == null || blank(employee.getFullName()).isBlank() || blank(employee.getDocumentId()).isBlank()) return false;

        try (Connection conn = Database.getConnection()) {
            if (documentExists(conn, employee.getDocumentId())) return false;
            conn.setAutoCommit(false);
            try {
                String personId = nextId(conn, "personas", "id_persona", "PER", 4);
                String contactId = nextId(conn, "contactos", "id_contacto", "CON", 4);
                String educationId = nextId(conn, "educacion", "id_educacion", "EDU", 4);
                String recordId = nextId(conn, "rel_principal", "id_registro", "REL", 4);
                String departmentId = resolveDepartmentId(conn, employee.getDepartment());
                String currentJobId = resolveJobTitleId(conn, employee.getCurrentJobTitle());
                String baseJobId = blank(employee.getBaseJobTitle()).isBlank()
                        ? currentJobId
                        : resolveJobTitleId(conn, employee.getBaseJobTitle());
                String statusId = resolveStatusId(conn, employee.getEmploymentStatus());
                String[] nameParts = splitName(employee.getFullName());

                try (PreparedStatement stmt = conn.prepareStatement("""
                        INSERT INTO personas(id_persona, cedula, primer_apellido, segundo_apellido, nombres, nombre_completo, expedida, tipo_sangre, fecha_nacimiento, edad, sexo)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """)) {
                    stmt.setString(1, personId);
                    stmt.setString(2, blank(employee.getDocumentId()));
                    stmt.setString(3, nameParts[0]);
                    stmt.setString(4, nameParts[1]);
                    stmt.setString(5, nameParts[2]);
                    stmt.setString(6, clean(employee.getFullName()));
                    stmt.setString(7, "TUNJA");
                    stmt.setString(8, "NO REGISTRADO");
                    stmt.setString(9, "NO REGISTRADO");
                    stmt.setString(10, "NO REGISTRADO");
                    stmt.setString(11, blankTo(clean(employee.getGender()), "NO REGISTRADO"));
                    stmt.executeUpdate();
                }

                try (PreparedStatement stmt = conn.prepareStatement("""
                        INSERT INTO contactos(id_contacto, direccion, ciudad, telefono_fijo, celular, correo_personal, correo_institucional)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """)) {
                    stmt.setString(1, contactId);
                    stmt.setString(2, "NO REGISTRADO");
                    stmt.setString(3, "TUNJA, BOYACA");
                    stmt.setString(4, "NO REGISTRADO");
                    stmt.setString(5, blankTo(employee.getPhone(), "NO REGISTRADO"));
                    stmt.setString(6, "NO REGISTRADO");
                    stmt.setString(7, blankTo(employee.getEmail(), "NO REGISTRADO").toLowerCase(Locale.ROOT));
                    stmt.executeUpdate();
                }

                try (PreparedStatement stmt = conn.prepareStatement("""
                        INSERT INTO educacion(id_educacion, estudios, matricula_profesional, institucion_estudios, postgrado, institucion_postgrado, diplomado_cap_sena, correo_institucional)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """)) {
                    stmt.setString(1, educationId);
                    stmt.setString(2, "NO REGISTRADO");
                    stmt.setString(3, "NO REGISTRADO");
                    stmt.setString(4, "NO REGISTRADO");
                    stmt.setString(5, "NO REGISTRADO");
                    stmt.setString(6, "NO REGISTRADO");
                    stmt.setString(7, "NO REGISTRADO");
                    stmt.setString(8, blankTo(employee.getEmail(), "NO REGISTRADO").toLowerCase(Locale.ROOT));
                    stmt.executeUpdate();
                }

                try (PreparedStatement stmt = conn.prepareStatement("""
                        INSERT INTO rel_principal(id_registro, id_persona, id_cargo_base, id_cargo_actual, id_dependencia, id_educacion, id_contacto, id_estado, otro_tiempo_gobernacion, fecha_ingreso, tiempo_servicio, fecha_encargo)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """)) {
                    stmt.setString(1, recordId);
                    stmt.setString(2, personId);
                    stmt.setString(3, baseJobId);
                    stmt.setString(4, currentJobId);
                    stmt.setString(5, departmentId);
                    stmt.setString(6, educationId);
                    stmt.setString(7, contactId);
                    stmt.setString(8, statusId);
                    stmt.setString(9, "NO REGISTRADO");
                    stmt.setString(10, blankTo(employee.getStartDate(), "NO REGISTRADO"));
                    stmt.setString(11, "0 ANOS 0 MESES");
                    stmt.setString(12, "NO REGISTRADO");
                    stmt.executeUpdate();
                }

                conn.commit();
                return true;
            } catch (Exception e) {
                conn.rollback();
                System.err.println("Error creating employee: " + e.getMessage());
                return false;
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (Exception e) {
            System.err.println("Error opening employee transaction: " + e.getMessage());
            return false;
        }
    }

    public boolean documentExists(String documentId) {
        try (Connection conn = Database.getConnection()) {
            return documentExists(conn, documentId);
        } catch (Exception e) {
            System.err.println("Error checking employee document: " + e.getMessage());
            return false;
        }
    }

    /**
     * Actualiza los datos básicos de un empleado ya existente (busca por cédula).
     * Actualiza tablas personas, contactos y rel_principal según los campos provistos
     * en el objeto Employee.
     */
    public boolean update(Employee employee) {
        if (employee == null || blank(employee.getDocumentId()).isBlank()) return false;
        try (Connection conn = Database.getConnection()) {
            // Buscar registro principal relacionado a la cedula
            String sql = "SELECT r.id_registro, r.id_persona, r.id_contacto FROM rel_principal r JOIN personas p ON p.id_persona = r.id_persona WHERE p.cedula = ? LIMIT 1";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, blank(employee.getDocumentId()));
                try (ResultSet rs = stmt.executeQuery()) {
                    if (!rs.next()) return false;
                    String idRegistro = rs.getString("id_registro");
                    String idPersona = rs.getString("id_persona");
                    String idContacto = rs.getString("id_contacto");

                    conn.setAutoCommit(false);
                    try {
                        // Update persona
                        try (PreparedStatement p = conn.prepareStatement("UPDATE personas SET nombre_completo = ?, sexo = ? WHERE id_persona = ?")) {
                            p.setString(1, clean(employee.getFullName()));
                            p.setString(2, blankTo(clean(employee.getGender()), "NO REGISTRADO"));
                            p.setString(3, idPersona);
                            p.executeUpdate();
                        }

                        // Update contacto
                        try (PreparedStatement c = conn.prepareStatement("UPDATE contactos SET correo_institucional = ?, celular = ? WHERE id_contacto = ?")) {
                            c.setString(1, blankTo(employee.getEmail(), "NO REGISTRADO").toLowerCase());
                            c.setString(2, blankTo(employee.getPhone(), "NO REGISTRADO"));
                            c.setString(3, idContacto);
                            c.executeUpdate();
                        }

                        // Resolve ids para dependencia y cargos y estado
                        String deptId = resolveDepartmentId(conn, employee.getDepartment());
                        String currentJobId = resolveJobTitleId(conn, employee.getCurrentJobTitle());
                        String baseJobId = blank(employee.getBaseJobTitle()).isBlank() ? currentJobId : resolveJobTitleId(conn, employee.getBaseJobTitle());
                        String statusId = resolveStatusId(conn, employee.getEmploymentStatus());

                        // Update rel_principal
                        try (PreparedStatement rupdate = conn.prepareStatement("UPDATE rel_principal SET id_dependencia = ?, id_cargo_actual = ?, id_cargo_base = ?, id_estado = ?, fecha_ingreso = ? WHERE id_registro = ?")) {
                            rupdate.setString(1, deptId);
                            rupdate.setString(2, currentJobId);
                            rupdate.setString(3, baseJobId);
                            rupdate.setString(4, statusId);
                            rupdate.setString(5, blankTo(employee.getStartDate(), "NO REGISTRADO"));
                            rupdate.setString(6, idRegistro);
                            rupdate.executeUpdate();
                        }

                        conn.commit();
                        return true;
                    } catch (Exception ex) {
                        conn.rollback();
                        System.err.println("Error updating employee: " + ex.getMessage());
                        return false;
                    } finally {
                        conn.setAutoCommit(true);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error opening employee update: " + e.getMessage());
            return false;
        }
    }

    /**
     * Elimina el registro principal asociado a la cédula. No elimina persona/contacto/educacion
     * para evitar inconsistencias; solo remueve la relación principal.
     */
    public boolean deleteByDocument(String documentId) {
        if (documentId == null || documentId.isBlank()) return false;
        try (Connection conn = Database.getConnection()) {
            String find = "SELECT r.id_registro FROM rel_principal r JOIN personas p ON p.id_persona = r.id_persona WHERE p.cedula = ? LIMIT 1";
            try (PreparedStatement f = conn.prepareStatement(find)) {
                f.setString(1, documentId);
                try (ResultSet rs = f.executeQuery()) {
                    if (!rs.next()) return false;
                    String idRegistro = rs.getString(1);
                    try (PreparedStatement del = conn.prepareStatement("DELETE FROM rel_principal WHERE id_registro = ?")) {
                        del.setString(1, idRegistro);
                        return del.executeUpdate() > 0;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error deleting employee: " + e.getMessage());
            return false;
        }
    }

    private String clean(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toUpperCase(new Locale("es", "CO"));
    }

    private boolean contains(String value, String filter) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(filter);
    }

    private boolean documentExists(Connection conn, String documentId) throws Exception {
        String sql = "SELECT 1 FROM personas WHERE cedula = ? LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, blank(documentId));
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    private String resolveDepartmentId(Connection conn, String department) throws Exception {
        String cleanDepartment = blankTo(clean(department), "NO REGISTRADO");
        String existing = findId(conn, "dependencias", "id_dependencia", "dependencia", cleanDepartment);
        if (existing != null) return existing;
        String id = nextId(conn, "dependencias", "id_dependencia", "DEP", 3);
        try (PreparedStatement stmt = conn.prepareStatement("INSERT INTO dependencias(id_dependencia, dependencia) VALUES (?, ?)")) {
            stmt.setString(1, id);
            stmt.setString(2, cleanDepartment);
            stmt.executeUpdate();
        }
        return id;
    }

    private String resolveJobTitleId(Connection conn, String jobTitle) throws Exception {
        String cleanJobTitle = blankTo(clean(jobTitle), "NO REGISTRADO");
        String existing = findId(conn, "cargos", "id_cargo", "cargo", cleanJobTitle);
        if (existing != null) return existing;
        String id = nextId(conn, "cargos", "id_cargo", "CAR", 3);
        try (PreparedStatement stmt = conn.prepareStatement("""
                INSERT INTO cargos(id_cargo, tipo_cargo, cargo, codigo, grado, asignacion_sueldo, nivel)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """)) {
            stmt.setString(1, id);
            stmt.setString(2, "PLANTA");
            stmt.setString(3, cleanJobTitle);
            stmt.setString(4, "N/A");
            stmt.setString(5, "N/A");
            stmt.setString(6, "$0");
            stmt.setString(7, "NO REGISTRADO");
            stmt.executeUpdate();
        }
        return id;
    }

    private String resolveStatusId(Connection conn, String status) throws Exception {
        String cleanStatus = blankTo(clean(status), "ACTIVO");
        String existing = findId(conn, "estados", "id_estado", "situacion", cleanStatus);
        if (existing != null) return existing;
        String id = nextId(conn, "estados", "id_estado", "EST", 3);
        try (PreparedStatement stmt = conn.prepareStatement("""
                INSERT INTO estados(id_estado, clasificacion_empleo, situacion, funciones_pagadas, novedades, opec)
                VALUES (?, ?, ?, ?, ?, ?)
                """)) {
            stmt.setString(1, id);
            stmt.setString(2, "NO REGISTRADO");
            stmt.setString(3, cleanStatus);
            stmt.setString(4, "NO REGISTRADO");
            stmt.setString(5, "Creado desde interfaz");
            stmt.setString(6, "NO REGISTRADO");
            stmt.executeUpdate();
        }
        return id;
    }

    private String findId(Connection conn, String tableName, String idColumn, String nameColumn, String value) throws Exception {
        String sql = "SELECT " + idColumn + " FROM " + tableName + " WHERE LOWER(" + nameColumn + ") = LOWER(?) LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, value);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? rs.getString(1) : null;
            }
        }
    }

    private String nextId(Connection conn, String tableName, String idColumn, String prefix, int width) throws Exception {
        int max = 0;
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT " + idColumn + " FROM " + tableName)) {
            while (rs.next()) {
                String digits = blank(rs.getString(1)).replaceAll("\\D", "");
                if (!digits.isBlank()) max = Math.max(max, Integer.parseInt(digits));
            }
        }
        return prefix + String.format("%0" + width + "d", max + 1);
    }

    private String[] splitName(String fullName) {
        String[] parts = clean(fullName).split("\\s+");
        if (parts.length == 0) return new String[]{"NO REGISTRADO", "NO REGISTRADO", "NO REGISTRADO"};
        if (parts.length == 1) return new String[]{parts[0], "NO REGISTRADO", parts[0]};
        if (parts.length == 2) return new String[]{parts[0], "NO REGISTRADO", parts[1]};
        return new String[]{
                parts[0],
                parts[1],
                Arrays.stream(parts).skip(2).collect(Collectors.joining(" "))
        };
    }

    private String blank(String value) {
        return value == null ? "" : value.trim();
    }

    private String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

}
