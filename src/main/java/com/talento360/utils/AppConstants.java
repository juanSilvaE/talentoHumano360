package com.talento360.utils;

public class AppConstants {

    private AppConstants() {}

    public static final String[] BAR_COLORS = {"#E8521A", "#F28C28", "#3B82F6", "#10B981"};

    public static final String[] PIE_COLORS = {
        "#10B981", // Aprobado / verde
        "#3B82F6", // En revisión / azul
        "#F59E0B", // Pendiente / ámbar
        "#EF4444", // Rechazado / rojo
        "#8B5CF6", // Otro / morado
        "#E8521A", // Extra / naranja
        "#06B6D4", // Extra / cyan
        "#64748B"  // Extra / gris
    };

    public static final String[] TIPOS_PROCESO = {"Vacaciones", "Permiso", "Incapacidad", "Licencia maternidad"};

    public static final String FONT_SIZE_AXIS = "-fx-tick-label-font-size: 12px; -fx-tick-label-fill: #334e68;";
    public static final String FONT_SIZE_LEGEND = "-fx-font-size: 12px; -fx-text-fill: #334e68;";
    public static final String FONT_SIZE_TOOLTIP = "-fx-font-size: 12px; -fx-font-weight: bold;";
    public static final String COLOR_DOT = "-fx-background-color: %s; -fx-background-radius: 5px;";

    public static final String BAR_STYLE =
        "-fx-bar-fill: %s;" +
        "-fx-background-color: %s;" +
        "-fx-background-radius: 4 4 0 0;" +
        "-fx-border-radius: 4 4 0 0;";

    public static final String BAR_HOVER_STYLE =
        "-fx-bar-fill: %sDD;" +
        "-fx-background-color: %sDD;" +
        "-fx-background-radius: 4 4 0 0;" +
        "-fx-border-radius: 4 4 0 0;" +
        "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.25), 6, 0, 0, 2);";

    public static final String PIE_STYLE = "-fx-pie-color: %s; -fx-background-color: %s;";
    public static final String PIE_HOVER_STYLE =
        "-fx-pie-color: %sCC;" +
        "-fx-background-color: %sCC;" +
        "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.3), 8, 0, 0, 2);";

    public static final String CHART_BG = "-fx-background-color: transparent;";
    public static final String CHART_PADDING = "-fx-background-color: transparent; -fx-padding: 0 0 0 0;";
}
