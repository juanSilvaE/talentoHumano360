package com.talento360.controllers;

import com.talento360.components.ChartCard;
import com.talento360.services.DashboardService;
import com.talento360.utils.AppConstants;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javafx.geometry.Pos;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.CategoryAxis;
import javafx.scene.chart.NumberAxis;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;
import javafx.scene.control.Label;
import javafx.scene.control.Tooltip;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.VBox;

public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    public VBox[] buildCharts() {
        Map<String, Integer> typeCounts = service.getRequestTypeCounts();
        Map<String, Integer> statusCounts = service.getRequestStatusCounts();
        int total = service.totalRequests(typeCounts);

        VBox barCard = buildBarChart(typeCounts, total);
        VBox pieCard = buildPieChart(statusCounts, total);

        return new VBox[]{barCard, pieCard};
    }

    private VBox buildBarChart(Map<String, Integer> typeCounts, int total) {
        CategoryAxis xAxis = new CategoryAxis();
        xAxis.setLabel("Tipo de solicitud");
        xAxis.setStyle(AppConstants.FONT_SIZE_AXIS);

        NumberAxis yAxis = new NumberAxis();
        yAxis.setLabel("Cantidad");
        yAxis.setStyle(AppConstants.FONT_SIZE_AXIS);
        int maxValue = service.getMaxValue(typeCounts);
        int upper = service.calcUpperBound(maxValue);
        yAxis.setAutoRanging(false);
        yAxis.setLowerBound(0);
        yAxis.setUpperBound(upper);
        yAxis.setTickUnit(service.calcTickUnit(upper));
        yAxis.setMinorTickVisible(false);

        BarChart<String, Number> bar = new BarChart<>(xAxis, yAxis);
        bar.setAnimated(false);
        bar.setPrefHeight(320);
        bar.setMaxHeight(320);
        bar.setBarGap(6);
        bar.setCategoryGap(40);
        bar.setHorizontalGridLinesVisible(true);
        bar.setVerticalGridLinesVisible(false);
        bar.setLegendVisible(false);
        bar.setStyle(AppConstants.CHART_PADDING);

        XYChart.Series<String, Number> serie = new XYChart.Series<>();
        serie.setName("Solicitudes");
        String[] tipos = AppConstants.TIPOS_PROCESO;
        for (int i = 0; i < tipos.length; i++) {
            String t = tipos[i];
            int val = typeCounts.getOrDefault(t, 0);
            XYChart.Data<String, Number> dataPoint = new XYChart.Data<>(t, val);
            final String color = AppConstants.BAR_COLORS[i % AppConstants.BAR_COLORS.length];
            final int finalVal = val;
            dataPoint.nodeProperty().addListener((obs, oldNode, node) -> {
                if (node == null) return;
                node.setStyle(String.format(AppConstants.BAR_STYLE, color, color));
                Tooltip tp = new Tooltip(t + ": " + finalVal + " registros");
                tp.setStyle(AppConstants.FONT_SIZE_TOOLTIP);
                Tooltip.install(node, tp);
                node.setOnMouseEntered(e ->
                    node.setStyle(String.format(AppConstants.BAR_HOVER_STYLE, color, color)));
                node.setOnMouseExited(e ->
                    node.setStyle(String.format(AppConstants.BAR_STYLE, color, color)));
            });
            serie.getData().add(dataPoint);
        }
        bar.getData().add(serie);

        FlowPane legend = new FlowPane(14, 8);
        legend.setAlignment(Pos.CENTER);
        for (int i = 0; i < tipos.length; i++) {
            String t = tipos[i];
            int v = typeCounts.getOrDefault(t, 0);
            String color = AppConstants.BAR_COLORS[i % AppConstants.BAR_COLORS.length];
            legend.getChildren().add(ChartCard.legendDot(color, t + ": " + v));
        }

        return new ChartCard()
            .title("Registros por proceso")
            .help("Cantidad de registros por tipo de proceso.")
            .chart(bar)
            .legend(legend)
            .summary("Total: " + total + " registros")
            .build();
    }

    private VBox buildPieChart(Map<String, Integer> statusCounts, int total) {
        PieChart pie = new PieChart();
        pie.setLabelsVisible(false);
        pie.setLegendVisible(false);
        pie.setAnimated(false);
        pie.setPrefHeight(260);
        pie.setMaxHeight(260);
        pie.setStyle(AppConstants.CHART_BG);

        List<PieChart.Data> pieDataList = new ArrayList<>();
        if (statusCounts.isEmpty()) {
            pieDataList.add(new PieChart.Data("Sin datos", 1));
        } else {
            for (Map.Entry<String, Integer> entry : statusCounts.entrySet()) {
                pieDataList.add(new PieChart.Data(entry.getKey(), entry.getValue()));
            }
        }
        pie.getData().addAll(pieDataList);

        for (int i = 0; i < pie.getData().size(); i++) {
            PieChart.Data data = pie.getData().get(i);
            final String color = AppConstants.PIE_COLORS[i % AppConstants.PIE_COLORS.length];
            final String label = data.getName();
            final int val = (int) data.getPieValue();
            data.nodeProperty().addListener((obs, oldNode, node) -> {
                if (node == null) return;
                node.setStyle(String.format(AppConstants.PIE_STYLE, color, color));
                Tooltip tp = new Tooltip(label + ": " + val + " solicitudes");
                tp.setStyle(AppConstants.FONT_SIZE_TOOLTIP);
                Tooltip.install(node, tp);
                node.setOnMouseEntered(e ->
                    node.setStyle(String.format(AppConstants.PIE_HOVER_STYLE, color, color)));
                node.setOnMouseExited(e ->
                    node.setStyle(String.format(AppConstants.PIE_STYLE, color, color)));
            });
        }

        FlowPane legend = new FlowPane(16, 8);
        legend.setAlignment(Pos.CENTER);
        for (int i = 0; i < pieDataList.size(); i++) {
            PieChart.Data data = pieDataList.get(i);
            String color = AppConstants.PIE_COLORS[i % AppConstants.PIE_COLORS.length];
            int val = (int) data.getPieValue();
            legend.getChildren().add(ChartCard.legendDot(color, data.getName() + ": " + val));
        }

        return new ChartCard()
            .title("Estado de solicitudes")
            .help("Distribución de solicitudes por estado actual.")
            .chart(pie)
            .legend(legend)
            .summary("Total: " + total + " solicitudes")
            .build();
    }
}
