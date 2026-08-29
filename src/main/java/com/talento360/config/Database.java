package com.talento360.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Database {
    private static final String URL = setting("talento360.db.url", "TALENTO360_DB_URL", "jdbc:postgresql://localhost:5432/talento360");
    private static final String USER = setting("talento360.db.user", "TALENTO360_DB_USER", "postgres");
    private static final String PASSWORD = setting("talento360.db.password", "TALENTO360_DB_PASSWORD", "admin123");

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    private static String setting(String propertyName, String environmentName, String fallback) {
        String propertyValue = System.getProperty(propertyName);
        if (propertyValue != null && !propertyValue.isBlank()) return propertyValue.trim();
        String environmentValue = System.getenv(environmentName);
        if (environmentValue != null && !environmentValue.isBlank()) return environmentValue.trim();
        return fallback;
    }
}
