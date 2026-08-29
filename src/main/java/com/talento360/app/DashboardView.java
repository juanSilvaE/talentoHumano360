package com.talento360.app;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.prefs.Preferences;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.talento360.controllers.DashboardController;
import com.talento360.models.Employee;
import com.talento360.services.DashboardService;
import com.talento360.utils.ExportUtils;
import com.talento360.utils.UIUtils;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.Separator;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.scene.control.OverrunStyle;
import javafx.scene.image.ImageView;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.Node;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class DashboardView {

    private final AppContext ctx;
    private final AppLayout layout;

    public DashboardView(AppContext ctx, AppLayout layout) {
        this.ctx = ctx;
        this.layout = layout;
    }

    public VBox build() {
        VBox shell = layout.pageShell();
        VBox content = new VBox(18);
        content.getStyleClass().add("page-content");
        VBox.setVgrow(content, Priority.ALWAYS);

        VBox greetingBox = new VBox(4);
        Label greeting = new Label("¡Hola, " + ctx.getAuthDAO().getCurrentName() + "!");
        greeting.getStyleClass().add("hero-title");
        Label description = new Label("Bienvenido(a) a Talento 360 Humano. Aquí tienes un resumen de la gestión del talento humano.");
        description.getStyleClass().add("hero-subtitle");
        greetingBox.getChildren().addAll(greeting, description);

        HBox cards = new HBox(14);
        cards.setMaxWidth(Double.MAX_VALUE);
        int employees = ctx.getDashboardDAO().count("personas");
        int departments = ctx.getDashboardDAO().count("dependencias");

        Node c1 = coloredStatCard("/assets/icon_people.png", "icon-bg-teal",
                "Servidores activos", UIUtils.format(employees), "Activos en este momento", "trend-neutral");
        Node c2 = coloredStatCard("/assets/icon_dependencias_unique.png", "icon-bg-blue",
                "Dependencias", UIUtils.format(departments), "Dependencias en uso", "trend-neutral");
        Node c3 = coloredStatCard("/assets/icon_cv_unique.png", "icon-bg-purple",
                "Hojas de vida", UIUtils.format(employees), "Hojas cargadas en la base", "trend-neutral");
        Node c4 = coloredStatCard("/assets/icon_documents_unique.png", "icon-bg-orange",
                "Documentos cargados", UIUtils.format(ctx.getDashboardDAO().count("personas") * 4),
                "Documentos registrados", "trend-label");
        for (Node c : List.of(c1, c2, c3, c4)) HBox.setHgrow(c, Priority.ALWAYS);
        cards.getChildren().addAll(c1, c2, c3, c4);

        DashboardController chartController = new DashboardController(new DashboardService(ctx.getDashboardDAO()));
        VBox[] chartCards = chartController.buildCharts();
        HBox charts = new HBox(16, chartCards[0], chartCards[1]);
        charts.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(chartCards[0], Priority.ALWAYS);
        HBox.setHgrow(chartCards[1], Priority.ALWAYS);

        HBox main = new HBox(16);
        main.setMaxWidth(Double.MAX_VALUE);

        VBox recordsCard = new VBox(12);
        recordsCard.getStyleClass().add("dashboard-table-card");
        recordsCard.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(recordsCard, Priority.ALWAYS);

        HBox recordsHeader = new HBox();
        recordsHeader.setAlignment(Pos.CENTER_LEFT);
        Label recordsTitle = new Label("Registros recientes");
        recordsTitle.getStyleClass().add("section-title");
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        Button export = new Button("  Exportar a Excel");
        ImageView xlsIcon = UIUtils.image("/assets/icon_excel.png", 15, 15, true);
        export.setGraphic(xlsIcon);
        export.getStyleClass().add("green-small-button");
        recordsHeader.getChildren().addAll(recordsTitle, spacer, export);

        final int pageSize = 20;
        List<Map<String, String>> dashboardRows = new ArrayList<>(ctx.getDashboardDAO().records(100));
        final int maxDashboardPages = Math.min(5, Math.max(1, (int) Math.ceil(dashboardRows.size() / (double) pageSize)));
        final int[] currentPage = {1};
        TableView<Map<String, String>> table = createDashboardTable(UIUtils.pageSlice(dashboardRows, currentPage[0], pageSize));
        table.getStyleClass().add("dashboard-table");
        table.setPrefHeight(650);
        table.setMaxHeight(Double.MAX_VALUE);
        VBox.setVgrow(table, Priority.ALWAYS);
        export.setOnAction(e -> ExportUtils.showExportDialog(ctx, table));

        HBox footer = new HBox(8);
        footer.setAlignment(Pos.CENTER_LEFT);
        footer.setPadding(new Insets(4, 0, 0, 0));
        Button all = new Button("Ver todos los registros  ›");
        all.getStyleClass().add("link-button");
        boolean[] showingAll = {false};
        Region paginationSpacer = new Region();
        HBox.setHgrow(paginationSpacer, Priority.ALWAYS);
        HBox pageButtons = new HBox(8);
        pageButtons.setAlignment(Pos.CENTER);
        Label chevLeft = new Label("‹");
        chevLeft.getStyleClass().add("pagination-arrow");
        Label chevRight = new Label("›");
        chevRight.getStyleClass().add("pagination-arrow");
        List<Button> dashboardPageButtons = new ArrayList<>();
        pageButtons.getChildren().add(chevLeft);
        for (int i = 1; i <= maxDashboardPages; i++) {
            final int pageNumber = i;
            Button pageButton = UIUtils.pageBtn(String.valueOf(i), i == 1);
            pageButton.setTooltip(new Tooltip("Página " + i + " de registros recientes. Entre mayor sea el número, más antiguos son los registros."));
            pageButton.setOnAction(e -> {
                if (showingAll[0]) return;
                currentPage[0] = pageNumber;
                table.getItems().setAll(UIUtils.pageSlice(dashboardRows, currentPage[0], pageSize));
                UIUtils.updatePageButtons(dashboardPageButtons, currentPage[0]);
            });
            dashboardPageButtons.add(pageButton);
            pageButtons.getChildren().add(pageButton);
        }
        pageButtons.getChildren().add(chevRight);

        Runnable refreshDashboardPage = () -> {
            table.getItems().setAll(UIUtils.pageSlice(dashboardRows, currentPage[0], pageSize));
            UIUtils.updatePageButtons(dashboardPageButtons, currentPage[0]);
        };
        chevLeft.setOnMouseClicked(e -> {
            if (showingAll[0]) return;
            if (currentPage[0] > 1) {
                currentPage[0]--;
                refreshDashboardPage.run();
            }
        });
        chevRight.setOnMouseClicked(e -> {
            if (showingAll[0]) return;
            if (currentPage[0] < maxDashboardPages) {
                currentPage[0]++;
                refreshDashboardPage.run();
            }
        });
        all.setOnAction(e -> {
            showingAll[0] = !showingAll[0];
            if (showingAll[0]) {
                table.getItems().setAll(dashboardRows);
                all.setText("Ver menos registros  ›");
                dashboardPageButtons.forEach(b -> b.setDisable(true));
            } else {
                currentPage[0] = 1;
                refreshDashboardPage.run();
                all.setText("Ver todos los registros  ›");
                dashboardPageButtons.forEach(b -> b.setDisable(false));
            }
        });
        footer.getChildren().addAll(all, paginationSpacer, pageButtons);
        recordsCard.getChildren().addAll(recordsHeader, table, footer);

        VBox employee = employeeCard();
        main.getChildren().addAll(recordsCard, employee);

        content.getChildren().addAll(greetingBox, cards, charts, main, layout.footerBar());
        shell.getChildren().add(content);
        return shell;
    }

    private VBox coloredStatCard(String iconPath, String bgClass, String title, String value, String trend, String trendClass) {
        HBox card = new HBox(14);
        card.getStyleClass().add("stat-card");
        card.setAlignment(Pos.CENTER_LEFT);
        card.setMaxWidth(Double.MAX_VALUE);

        StackPane iconBg = new StackPane();
        iconBg.getStyleClass().add(bgClass);
        ImageView iv = UIUtils.image(iconPath, 30, 30, true);
        iconBg.getChildren().add(iv);

        VBox text = new VBox(4);
        Label t = new Label(title);
        t.getStyleClass().add("stat-title");
        Label v = new Label(value);
        v.getStyleClass().add("stat-value");
        Label tr = new Label(trend);
        tr.getStyleClass().add(trendClass);
        text.getChildren().addAll(t, v, tr);
        card.getChildren().addAll(iconBg, text);
        VBox wrap = new VBox(card);
        HBox.setHgrow(wrap, Priority.ALWAYS);
        return wrap;
    }

    private TableView<Map<String, String>> createDashboardTable(List<Map<String, String>> rows) {
        TableView<Map<String, String>> table = new TableView<>();
        table.setItems(FXCollections.observableArrayList(rows));
        table.setColumnResizePolicy(TableView.UNCONSTRAINED_RESIZE_POLICY);

        if (rows.isEmpty()) return table;

        for (String key : rows.get(0).keySet()) {
            TableColumn<Map<String, String>, String> col = new TableColumn<>(key);
            col.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().getOrDefault(key, "")));

            if (key.equals("Proceso")) {
                col.setCellFactory(tc -> new TableCell<>() {
                    @Override
                    protected void updateItem(String item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty || item == null) { setGraphic(null); setText(null); return; }
                        Label tag = new Label(UIUtils.procesoIcon(item) + " " + item);
                        tag.getStyleClass().add(UIUtils.procesoTagClass(item));
                        setGraphic(tag);
                        setText(null);
                    }
                });
            } else if (key.equals("Estado")) {
                col.setCellFactory(tc -> new TableCell<>() {
                    @Override
                    protected void updateItem(String item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty || item == null) { setGraphic(null); setText(null); return; }
                        Label badge = new Label("● " + item);
                        badge.getStyleClass().add(UIUtils.dashboardBadgeClass(item));
                        setGraphic(badge);
                        setText(null);
                    }
                });
            }

            col.setPrefWidth(switch (key) {
                case "Descripción", "Dependencia", "Servidor" -> 190;
                case "Radicado" -> 150;
                case "Estado" -> 125;
                case "Proceso" -> 150;
                case "Fecha" -> 135;
                default -> 95;
            });
            table.getColumns().add(col);
        }
        return table;
    }

    private VBox employeeCard() {
        VBox box = new VBox(12);
        box.getStyleClass().add("employee-card");
        box.setPrefWidth(305);
        box.setMinWidth(285);
        box.setAlignment(Pos.TOP_CENTER);

        HBox titleRow = new HBox(8);
        titleRow.setAlignment(Pos.CENTER_LEFT);
        // Mostrar título y mes en una sola etiqueta para evitar truncado con '...'
        Preferences prefs = Preferences.userNodeForPackage(com.talento360.MainApp.class);
        String savedMonthText = prefs.get("employee_of_month_text", null);
        String monthName = LocalDate.now().getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES"));
        Label empTitleFull = new Label(savedMonthText == null ? "Empleado del mes de " + UIUtils.lowerUi(monthName) : savedMonthText);
        empTitleFull.getStyleClass().add("section-title");
        // permitir wrapping y evitar que el texto muestre '...'
        empTitleFull.setWrapText(true);
        empTitleFull.setTextOverrun(OverrunStyle.CLIP);
        empTitleFull.prefWidthProperty().bind(box.widthProperty().subtract(32));
        // clic para editar el mes: abrimos el selector y, si cambia, actualizamos el texto
        empTitleFull.setOnMouseClicked(ev -> {
            showMonthPickerDialog(empTitleFull);
        });
        Region trSpacer = new Region();
        HBox.setHgrow(trSpacer, Priority.ALWAYS);
        titleRow.getChildren().addAll(empTitleFull, trSpacer);

        Region shortGold = new Region();
        shortGold.getStyleClass().add("employee-gold-line");

        StackPane medalStack = new StackPane();
        medalStack.getStyleClass().add("employee-medal-box");
        ImageView medal = UIUtils.image("/assets/employee_medal.png", 210, 175, true);
        medal.setSmooth(true);
        medalStack.getChildren().add(medal);
        medalStack.setPrefHeight(175);

        Label name = new Label("Selecciona un empleado");
        name.getStyleClass().add("employee-name");
        Label role = new Label("");
        role.getStyleClass().add("employee-role");

        // Cargar empleado guardado en preferencias (si existe)
        String savedEmployeeDoc = prefs.get("employee_of_month_doc", "");
        if (savedEmployeeDoc != null && !savedEmployeeDoc.isBlank()) {
            try {
                List<Employee> found = ctx.getEmployeeDAO().list(savedEmployeeDoc);
                if (found != null && !found.isEmpty()) {
                    Employee e = found.get(0);
                    name.setText(e.getFullName());
                    role.setText(e.getCurrentJobTitle());
                }
            } catch (Exception ex) {
                // no fallamos si no encontramos el empleado
            }
        }

        Separator sep = new Separator();
        sep.getStyleClass().add("gold-separator");

        HBox trophyRow = new HBox(12);
        trophyRow.getStyleClass().add("recognition-box");
        trophyRow.setAlignment(Pos.CENTER_LEFT);
        ImageView trophyIcon = UIUtils.image("/assets/icon_trophy_unique.png", 34, 34, true);
        Label text = new Label("Reconocimiento por su\ncompromiso, dedicación\ny aporte al desarrollo\ninstitucional.");
        text.getStyleClass().add("employee-text");
        text.setWrapText(true);
        trophyRow.getChildren().addAll(trophyIcon, text);

        Button btn = new Button("Ver reconocimiento");
        btn.setGraphic(UIUtils.image("/assets/icon_trophy_unique.png", 16, 16, true));
        btn.getStyleClass().add("green-button");
        btn.setMaxWidth(Double.MAX_VALUE);
        btn.setOnAction(e -> ctx.showAlert("Empleado del mes", name.getText() + " · " + role.getText() + "\n\nReconocimiento por su compromiso, dedicación y aporte al desarrollo institucional."));

        // (Se eliminó el botón de editar desde la tarjeta para simplificar flujo)

        // Botón para seleccionar otro empleado y actualizar la tarjeta
        Button selectBtn = new Button("Seleccionar empleado");
        selectBtn.setGraphic(UIUtils.image("/assets/icon_people.png", 14, 14, true));
        selectBtn.getStyleClass().add("green-button");
        selectBtn.setOnAction(e -> showSelectEmployeeDialog(name, role));

        box.getChildren().addAll(titleRow, shortGold, medalStack, name, role, sep, trophyRow, btn, selectBtn);
        return box;
    }

    private void showSelectEmployeeDialog(Label nameLabel, Label roleLabel) {
        if (ctx.getAppFrame() == null) return;
        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card-large");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_people_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox headerTexts = new VBox(3);
        Label title = new Label("Seleccionar empleado");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Busca y selecciona un servidor para mostrar en la tarjeta.");
        subtitle.getStyleClass().add("modal-subtitle");
        headerTexts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, headerTexts);

        TextField search = UIUtils.decoratedTextField("Buscar por nombre, cédula, dependencia o cargo...");
        HBox searchRow = new HBox(10, search);
        searchRow.setAlignment(Pos.CENTER_LEFT);

        TableView<Employee> table = createEmployeeTable(ctx.getEmployeeDAO().list(""));
        table.setPrefHeight(360);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button select = new Button("Seleccionar");
        select.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, select);

        card.getChildren().addAll(header, searchRow, table, actions);
        StackPane overlay = ctx.modalOverlay(card);

        cancel.setOnAction(e -> ctx.closeOverlay(overlay));
        select.setOnAction(e -> {
            Employee sel = table.getSelectionModel().getSelectedItem();
            if (sel == null) { ctx.showAlert("Sin selección", "Selecciona un empleado de la lista."); return; }
            nameLabel.setText(sel.getFullName());
            roleLabel.setText(sel.getCurrentJobTitle());
            // Guardar selección en preferencias para mantener entre reinicios
            try {
                Preferences prefs = Preferences.userNodeForPackage(com.talento360.MainApp.class);
                prefs.put("employee_of_month_doc", sel.getDocumentId() == null ? "" : sel.getDocumentId());
                // mantener también texto de la tarjeta actual por si se editó el mes
            } catch (Exception ex) {
                // ignorar fallos de persistencia de preferencias
            }
            ctx.closeOverlay(overlay);
        });

        // Realiza la búsqueda al pulsar Enter en el campo (no volver a lanzarse a sí mismo)
        search.setOnAction(e -> {
            List<Employee> res = ctx.getEmployeeDAO().list(search.getText());
            table.setItems(FXCollections.observableArrayList(res));
            if (!res.isEmpty()) table.getSelectionModel().select(0);
        });
        // También actualizar en cada tecla para una búsqueda interactiva
        search.setOnKeyReleased(e -> {
            List<Employee> res = ctx.getEmployeeDAO().list(search.getText());
            table.setItems(FXCollections.observableArrayList(res));
            if (!res.isEmpty()) table.getSelectionModel().select(0);
        });
    }

    private void showMonthPickerDialog(Label empMonth) {
        if (ctx.getAppFrame() == null || empMonth == null) return;
        VBox card = new VBox(12);
        card.getStyleClass().add("modal-card");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_calendar_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox texts = new VBox(3);
        Label title = new Label("Editar mes del reconocimiento");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Selecciona el mes y año que aparecerán en la tarjeta.");
        subtitle.getStyleClass().add("modal-subtitle");
        texts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, texts);

        ComboBox<String> months = new ComboBox<>(FXCollections.observableArrayList(
                List.of("ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE")
        ));
        // intentar extraer el mes actual desde la etiqueta (soporta distintos formatos)
        String labelText = empMonth.getText() == null ? "" : empMonth.getText().toUpperCase();
        String found = null;
        for (String m : months.getItems()) {
            if (labelText.contains(m)) { found = m; break; }
        }
        if (found != null) months.setValue(found);
        else months.setValue(months.getItems().get(LocalDate.now().getMonthValue() - 1));

        ComboBox<Integer> years = new ComboBox<>(FXCollections.observableArrayList(
                List.of(LocalDate.now().getYear() - 1, LocalDate.now().getYear(), LocalDate.now().getYear() + 1)
        ));
        // intentar extraer año desde la etiqueta
        Integer foundYear = null;
        Matcher yr = Pattern.compile("(19|20)\\d{2}").matcher(empMonth.getText() == null ? "" : empMonth.getText());
        if (yr.find()) {
            try { foundYear = Integer.parseInt(yr.group()); } catch (Exception ignored) {}
        }
        years.setValue(foundYear == null ? LocalDate.now().getYear() : foundYear);

        HBox pickers = new HBox(8, months, years);
        pickers.setAlignment(Pos.CENTER_LEFT);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar"); cancel.getStyleClass().add("secondary-button");
        Button save = new Button("Guardar"); save.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, save);

        card.getChildren().addAll(header, pickers, actions);
        StackPane overlay = ctx.modalOverlay(card);

        cancel.setOnAction(e -> ctx.closeOverlay(overlay));
        save.setOnAction(e -> {
            String m = months.getValue() == null ? months.getItems().get(LocalDate.now().getMonthValue() - 1) : months.getValue();
            Integer y = years.getValue() == null ? LocalDate.now().getYear() : years.getValue();
            String current = empMonth.getText() == null ? "" : empMonth.getText().toLowerCase();
            if (current.contains("empleado")) {
                empMonth.setText("Empleado del mes de " + UIUtils.lowerUi(m) + " " + y);
            } else {
                empMonth.setText(m + " " + y);
            }
            // persistir texto del mes para que se mantenga entre reinicios
            try {
                Preferences prefs = Preferences.userNodeForPackage(com.talento360.MainApp.class);
                prefs.put("employee_of_month_text", empMonth.getText());
            } catch (Exception ex) {
                // ignorar
            }
            ctx.closeOverlay(overlay);
        });
    }

    private TableView<Employee> createEmployeeTable(List<Employee> employees) {
        TableView<Employee> table = new TableView<>(FXCollections.observableArrayList(employees));
        table.getStyleClass().add("profile-search-table");
        table.getStyleClass().add("perfil-summary-table");
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        UIUtils.addColumn(table, "Cédula", Employee::getDocumentId, 125);
        UIUtils.addColumn(table, "Nombre", Employee::getFullName, 240);
        UIUtils.addColumn(table, "Dependencia", Employee::getDepartment, 260);
        UIUtils.addColumn(table, "Cargo actual", Employee::getCurrentJobTitle, 220);

        TableColumn<Employee, String> statusCol = new TableColumn<>("Situación");
        statusCol.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().getEmploymentStatus()));
        statusCol.setCellFactory(tc -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setGraphic(null); setText(null); return; }
                setGraphic(UIUtils.statusBadge(item.toUpperCase(), UIUtils.employeeStatusBadgeClass(item)));
                setText(null);
            }
        });
        statusCol.setPrefWidth(130);
        table.getColumns().add(statusCol);
        TableColumn<Employee, String> acciones = new TableColumn<>("Acciones");
        acciones.setCellValueFactory(cell -> new SimpleStringProperty(""));
        acciones.setCellFactory(tc -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getIndex() < 0 || getIndex() >= getTableView().getItems().size()) {
                    setGraphic(null);
                    return;
                }
                Employee row = getTableView().getItems().get(getIndex());
                HBox box = new HBox(8);
                box.setAlignment(Pos.CENTER);
                Button view = UIUtils.actionIconButton("/assets/icon_view.png", "Ver perfil");
                view.setOnAction(e -> {
                    // select and show details
                    getTableView().getSelectionModel().select(row);
                });
                Button edit = UIUtils.actionIconButton("/assets/icon_file.png", "Editar perfil");
                edit.setOnAction(e -> showEditUserDialog(getTableView(), null, row));
                Button del = UIUtils.actionIconButton("/assets/status_denied.png", "Eliminar perfil");
                del.setOnAction(e -> showDeleteUserDialog(row, getTableView(), null));
                box.getChildren().addAll(view, edit, del);
                setGraphic(box);
                setText(null);
            }
        });
        acciones.setPrefWidth(160);
        table.getColumns().add(acciones);
        return table;
    }

    private void showEditUserDialog(TableView<Employee> table, VBox details, Employee existing) {
        if (ctx.getAppFrame() == null || existing == null) return;
        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card-large");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_profile_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox headerTexts = new VBox(3);
        Label title = new Label("Editar usuario");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Actualiza los datos del servidor en el sistema.");
        subtitle.getStyleClass().add("modal-subtitle");
        headerTexts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, headerTexts);

        GridPane form = new GridPane();
        form.getStyleClass().add("decorated-form");
        form.setHgap(14);
        form.setVgap(12);
        form.setPadding(new Insets(16));
        ColumnConstraints fc1 = new ColumnConstraints(); fc1.setHgrow(Priority.ALWAYS);
        ColumnConstraints fc2 = new ColumnConstraints(); fc2.setHgrow(Priority.ALWAYS); fc2.setPercentWidth(50);
        form.getColumnConstraints().addAll(fc1, fc2);

        TextField fullName = UIUtils.decoratedTextField("Nombre completo");
        fullName.setText(existing.getFullName());
        TextField document = UIUtils.decoratedTextField("Cédula");
        document.setText(existing.getDocumentId());
        document.setDisable(true);
        ComboBox<String> department = UIUtils.editableCombo(ctx.getDepartmentDAO().listDepartmentNames(), "Dependencia");
        UIUtils.setComboValue(department, existing.getDepartment());
        ComboBox<String> jobTitle = UIUtils.editableCombo(ctx.getDepartmentDAO().listJobTitleNames(), "Cargo");
        UIUtils.setComboValue(jobTitle, existing.getCurrentJobTitle());
        ComboBox<String> gender = new ComboBox<>(FXCollections.observableArrayList("F", "M", "NO REGISTRADO"));
        gender.setValue(existing.getGender() == null || existing.getGender().isBlank() ? "NO REGISTRADO" : existing.getGender());
        gender.getStyleClass().add("combo");
        gender.setMaxWidth(Double.MAX_VALUE);
        ComboBox<String> status = new ComboBox<>(FXCollections.observableArrayList("ACTIVO", "ENCARGO", "PROVISIONAL", "RETIRADO"));
        status.setValue(existing.getEmploymentStatus() == null || existing.getEmploymentStatus().isBlank() ? "ACTIVO" : existing.getEmploymentStatus());
        status.getStyleClass().add("combo");
        status.setMaxWidth(Double.MAX_VALUE);
        DatePicker startDate = UIUtils.datePicker("Fecha de ingreso");
        startDate.setPrefWidth(220);
        startDate.setValue(UIUtils.parseUiDate(existing.getStartDate()));
        TextField email = UIUtils.decoratedTextField("Correo");
        email.setText(existing.getEmail());
        TextField phone = UIUtils.decoratedTextField("Celular");
        phone.setText(existing.getPhone());

        form.add(UIUtils.formField("Nombre completo", fullName), 0, 0);
        form.add(UIUtils.formField("Cédula", document), 1, 0);
        form.add(UIUtils.formField("Dependencia", department), 0, 1);
        form.add(UIUtils.formField("Cargo", jobTitle), 1, 1);
        form.add(UIUtils.formField("Género", gender), 0, 2);
        form.add(UIUtils.formField("Situación", status), 1, 2);
        form.add(UIUtils.formField("Fecha de ingreso", startDate), 0, 3);
        form.add(UIUtils.formField("Correo", email), 1, 3);
        form.add(UIUtils.formField("Celular", phone), 0, 4);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button save = new Button("Guardar cambios");
        save.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, save);

        card.getChildren().addAll(header, form, actions);
        StackPane overlay = ctx.modalOverlay(card);

        cancel.setOnAction(e -> ctx.closeOverlay(overlay));
        save.setOnAction(e -> {
            String fullNameText = fullName.getText() == null ? "" : fullName.getText().trim();
            String departmentText = UIUtils.comboText(department);
            String jobTitleText = UIUtils.comboText(jobTitle);
            if (fullNameText.isBlank() || departmentText.isBlank() || jobTitleText.isBlank()) {
                ctx.showAlert("Formulario incompleto", "Completa nombre, dependencia y cargo antes de guardar.");
                return;
            }
            Employee updated = new Employee(
                    existing.getRecordId(),
                    existing.getDocumentId(),
                    UIUtils.upperUi(fullNameText),
                    UIUtils.upperUi(departmentText),
                    UIUtils.upperUi(jobTitleText),
                    UIUtils.upperUi(jobTitleText),
                    email.getText() == null ? "" : email.getText().trim(),
                    phone.getText() == null ? "" : phone.getText().trim(),
                    UIUtils.comboText(status),
                    UIUtils.formatUiDate(startDate.getValue()),
                    UIUtils.comboText(gender)
            );
            if (ctx.getEmployeeDAO().update(updated)) {
                ctx.closeOverlay(overlay);
                List<Employee> result = ctx.getEmployeeDAO().list("");
                if (table != null) table.setItems(FXCollections.observableArrayList(result));
                if (table != null) UIUtils.selectEmployeeByDocument(table, details, updated.getDocumentId());
                ctx.showAlert("Usuario actualizado", "Los datos del usuario fueron actualizados correctamente.");
            } else {
                ctx.showAlert("No se pudo actualizar", "Ocurrió un error al actualizar el usuario en la base de datos.");
            }
        });
    }

    private void showDeleteUserDialog(Employee existing, TableView<Employee> table, VBox details) {
        if (ctx.getAppFrame() == null || existing == null) return;
        VBox card = new VBox(12);
        card.getStyleClass().add("modal-card");
        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/status_denied.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box-danger");
        VBox texts = new VBox(3);
        Label title = new Label("Eliminar usuario");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("¿Estás seguro de eliminar el perfil de \"" + existing.getFullName() + "\"? Esta acción removerá la relación principal del sistema.");
        subtitle.getStyleClass().add("modal-subtitle");
        texts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, texts);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button del = new Button("Eliminar");
        del.getStyleClass().add("danger-button");
        actions.getChildren().addAll(cancel, del);

        card.getChildren().addAll(header, actions);
        StackPane overlay = ctx.modalOverlay(card);
        cancel.setOnAction(e -> ctx.closeOverlay(overlay));
        del.setOnAction(e -> {
            if (ctx.getEmployeeDAO().deleteByDocument(existing.getDocumentId())) {
                ctx.closeOverlay(overlay);
                if (table != null) table.setItems(FXCollections.observableArrayList(ctx.getEmployeeDAO().list("")));
                if (details != null) details.getChildren().setAll(UIUtils.emptyProfileCard());
                ctx.showAlert("Usuario eliminado", "El perfil fue eliminado correctamente (relación principal removida).");
            } else {
                ctx.showAlert("No se pudo eliminar", "No se pudo eliminar el perfil. Es posible que no exista o que la base de datos devuelva una restricción.");
            }
        });
    }
}
