package com.talento360.components;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;

public class ChartCard {

    private final VBox card;

    public ChartCard() {
        card = new VBox(10);
        card.getStyleClass().add("chart-card");
    }

    public ChartCard title(String text) {
        Label t = new Label(text);
        t.getStyleClass().add("section-title");
        card.getChildren().add(t);
        return this;
    }

    public ChartCard help(String text) {
        Label h = new Label(text);
        h.setWrapText(true);
        h.getStyleClass().add("chart-helper");
        h.prefWidthProperty().bind(card.widthProperty().subtract(20));
        card.getChildren().add(h);
        return this;
    }

    public ChartCard chart(Node chart) {
        card.getChildren().add(chart);
        return this;
    }

    public ChartCard legend(Node legend) {
        card.getChildren().add(legend);
        return this;
    }

    public ChartCard summary(String text) {
        Label s = new Label(text);
        s.getStyleClass().add("chart-summary");
        card.getChildren().add(s);
        return this;
    }

    public VBox build() {
        return card;
    }

    public static HBox packSideBySide(VBox left, VBox right, double spacing) {
        HBox container = new HBox(spacing, left, right);
        container.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(left, Priority.ALWAYS);
        HBox.setHgrow(right, Priority.ALWAYS);
        return container;
    }

    public static HBox legendDot(String color, String text) {
        HBox item = new HBox(6);
        item.setAlignment(Pos.CENTER_LEFT);
        Region dot = new Region();
        dot.setMinSize(10, 10);
        dot.setMaxSize(10, 10);
        dot.setStyle("-fx-background-color: " + color + "; -fx-background-radius: 5px;");
        Label lbl = new Label(text);
        lbl.setStyle("-fx-font-size: 12px; -fx-text-fill: #334e68;");
        item.getChildren().addAll(dot, lbl);
        return item;
    }
}
