package com.talento360.utils;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.talento360.app.AppContext;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Rectangle;
import javafx.stage.FileChooser;

public final class ExportUtils {

    private ExportUtils() {}

    private static StackPane makeExcelIcon(int size) {
        Rectangle bg = new Rectangle(size, size);
        bg.setArcWidth(4);
        bg.setArcHeight(4);
        bg.setFill(Color.web("#185C37"));
        Label text = new Label("XLS");
        text.setTextFill(Color.WHITE);
        text.setStyle("-fx-font-weight: bold; -fx-font-size: " + (size * 0.35) + "px;");
        return new StackPane(bg, text);
    }

    public static void exportMapTable(TableView<Map<String, String>> table, File file) {
        if (table.getItems().isEmpty()) {
            return;
        }
        try {
            List<String> headers = new ArrayList<>(table.getItems().get(0).keySet());
            UIUtils.writeSimpleXlsx(file, headers, table.getItems());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static void showExportDialog(AppContext ctx, TableView<Map<String, String>> table) {
        if (table.getItems().isEmpty()) {
            ctx.showAlert("Sin datos", "No hay registros para exportar.");
            return;
        }

        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card");
        card.setMaxWidth(460);

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = makeExcelIcon(28);
        iconBox.getStyleClass().add("modal-icon-box");
        VBox headerTexts = new VBox(3);
        Label title = new Label("Exportar a Excel");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Elige el nombre del archivo Excel para guardar los registros.");
        subtitle.getStyleClass().add("modal-subtitle");
        headerTexts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, headerTexts);

        Label nameLabel = new Label("Nombre del archivo");
        nameLabel.getStyleClass().add("field-label");
        TextField fileName = new TextField("registros_recientes.xlsx");
        fileName.getStyleClass().add("input");
        fileName.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(fileName, Priority.ALWAYS);

        Button fileBtn = new Button("Examinar");
        fileBtn.setGraphic(UIUtils.image("/assets/icon_file_unique.png", 16, 16, true));
        fileBtn.setContentDisplay(javafx.scene.control.ContentDisplay.LEFT);
        fileBtn.setAlignment(Pos.CENTER);
        fileBtn.getStyleClass().add("secondary-button");
        fileBtn.setPrefWidth(140);
        fileBtn.setOnAction(e -> {
            FileChooser chooser = new FileChooser();
            chooser.setTitle("Guardar Excel");
            chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("Archivo Excel", "*.xlsx"));
            chooser.setInitialFileName(fileName.getText());
            File chosen = chooser.showSaveDialog(ctx.getStage());
            if (chosen != null) fileName.setText(chosen.getAbsolutePath());
        });

        HBox fileRow = new HBox(8, fileName, fileBtn);
        fileRow.setAlignment(Pos.CENTER_LEFT);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button save = new Button("  Exportar");
        save.setGraphic(makeExcelIcon(16));
        save.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, save);

        card.getChildren().addAll(header, nameLabel, fileRow, actions);
        StackPane overlay = ctx.modalOverlay(card);

        cancel.setOnAction(e -> ctx.closeOverlay(overlay));
        save.setOnAction(e -> {
            String path = fileName.getText() == null ? "" : fileName.getText().trim();
            if (path.isBlank()) {
                ctx.showAlert("Campo vacío", "Escribe un nombre para el archivo.");
                return;
            }
            File file = new File(path);
            if (!path.toLowerCase().endsWith(".xlsx")) {
                file = new File(path + ".xlsx");
            }
            boolean overwrite = true;
            if (file.exists()) {
                ctx.showAlert("Archivo existente", "El archivo ya existe. Se sobrescribirá.");
            }
            try {
                exportMapTable(table, file);
                ctx.closeOverlay(overlay);
                ctx.showAlert("Exportación lista", "El archivo Excel fue creado correctamente.");
            } catch (Exception ex) {
                ctx.showAlert("Error", "No se pudo exportar: " + ex.getMessage());
            }
        });
    }
}
