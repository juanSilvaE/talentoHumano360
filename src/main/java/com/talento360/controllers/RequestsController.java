package com.talento360.controllers;

import java.io.File;
import java.io.FileWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.talento360.dao.AuthDAO;
import com.talento360.dao.DepartmentDAO;
import com.talento360.dao.EmployeeDAO;
import com.talento360.dao.RequestDAO;
import com.talento360.models.AdministrativeRequest;
import com.talento360.models.Employee;
import com.talento360.utils.UIUtils;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.ContentDisplay;
import javafx.scene.control.Control;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.scene.image.ImageView;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Circle;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

public class RequestsController {

    private final Stage stage;
    private final StackPane appFrame;
    private final AuthDAO authDAO;
    private final RequestDAO requestDAO;
    private final DepartmentDAO departmentDAO;
    private final EmployeeDAO employeeDAO;
    private final Map<Integer, String> statusOverrides;
    private Runnable activeRequestsRefresh;
    private Runnable activeRequestsReset;

    public RequestsController(Stage stage, StackPane appFrame, AuthDAO authDAO,
                              RequestDAO requestDAO, DepartmentDAO departmentDAO,
                              EmployeeDAO employeeDAO,
                              Map<Integer, String> statusOverrides,
                              Runnable activeRequestsRefresh,
                              Runnable activeRequestsReset) {
        this.stage = stage;
        this.appFrame = appFrame;
        this.authDAO = authDAO;
        this.requestDAO = requestDAO;
        this.departmentDAO = departmentDAO;
        this.employeeDAO = employeeDAO;
        this.statusOverrides = statusOverrides;
        this.activeRequestsRefresh = activeRequestsRefresh;
        this.activeRequestsReset = activeRequestsReset;
    }

    // ──────────────────────────────────────────────
    //  1. setVacationsView
    // ──────────────────────────────────────────────
    public void setVacationsView() {
        openRequestModule("Vacaciones");
    }

    // ──────────────────────────────────────────────
    //  2. openRequestModule
    // ──────────────────────────────────────────────
    public void openRequestModule(String type) {
        switch (type == null ? "" : type) {
            case "Incapacidad" -> setRequestsView("Incapacidades", "Incapacidad");
            case "Permiso" -> setRequestsView("Permisos", "Permiso");
            case "Licencia maternidad" -> setRequestsView("Licencia por maternidad", "Licencia maternidad");
            default -> setRequestsView("Vacaciones", "Vacaciones");
        }
    }

    // ──────────────────────────────────────────────
    //  3. setRequestsView
    // ──────────────────────────────────────────────
    public void setRequestsView(String pageTitle, String activeType) {
        VBox shell = pageShell();
        VBox content = new VBox(18);
        content.getStyleClass().add("page-content");

        HBox titleRow = new HBox();
        titleRow.setAlignment(Pos.CENTER_LEFT);
        VBox titleTexts = new VBox(4);
        Label title = new Label(pageTitle);
        title.getStyleClass().add("hero-title");
        Label subtitle = new Label("Módulo específico para consultar, filtrar, registrar, editar estados y descargar soportes de " + pageTitle.toLowerCase() + ".");
        subtitle.getStyleClass().add("hero-subtitle");
        titleTexts.getChildren().addAll(title, subtitle);
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        Button newBtn = new Button("  Nueva solicitud");
        ImageView plusIcon = UIUtils.image("/assets/icon_plus_unique.png", 17, 17, true);
        newBtn.setGraphic(plusIcon);
        newBtn.getStyleClass().add("green-button");
        titleRow.getChildren().addAll(titleTexts, spacer, newBtn);

        HBox summaryCards = new HBox(14);
        summaryCards.setMaxWidth(Double.MAX_VALUE);

        VBox filters = new VBox(10);
        filters.getStyleClass().add("filter-card");
        HBox filterTopRow = new HBox(14);
        filterTopRow.setAlignment(Pos.BOTTOM_LEFT);
        filterTopRow.setMaxWidth(Double.MAX_VALUE);
        HBox filterBottomRow = new HBox(14);
        filterBottomRow.setAlignment(Pos.BOTTOM_LEFT);
        filterBottomRow.setMaxWidth(Double.MAX_VALUE);
        DatePicker start = UIUtils.datePicker("");
        start.setPrefWidth(220);
        DatePicker end = UIUtils.datePicker("");
        end.setPrefWidth(220);
        ComboBox<String> status = new ComboBox<>(FXCollections.observableArrayList("Todos", "Aprobada", "En revisión", "Finalizada", "Rechazada", "Pendiente"));
        status.setValue("Todos");
        status.getStyleClass().add("combo");
        ComboBox<String> departmentFilter = UIUtils.editableCombo(UIUtils.withDefault("Todas", departmentDAO.listDepartmentNames()), "Todas");
        departmentFilter.setValue("Todas");
        departmentFilter.setPrefWidth(230);
        ComboBox<String> jobTitleFilter = UIUtils.editableCombo(UIUtils.withDefault("Todos", departmentDAO.listJobTitleNames()), "Todos");
        jobTitleFilter.setValue("Todos");
        jobTitleFilter.setPrefWidth(210);
        TextField search = UIUtils.filterField("Buscar radicado, servidor o dependencia...");
        search.setMaxWidth(Double.MAX_VALUE);
        Button requestSearchButton = new Button("Buscar");
        requestSearchButton.getStyleClass().add("primary-button");
        Button clearFiltersButton = new Button("Limpiar");
        clearFiltersButton.getStyleClass().add("secondary-button");
        filterTopRow.getChildren().addAll(
                filterBox("Fecha inicio", start),
                filterBox("Fecha fin", end),
                filterBox("Estado", status),
                filterBox("Dependencia", departmentFilter),
                filterBox("Cargo", jobTitleFilter)
        );
        VBox searchBox = filterBox("Buscar", search);
        HBox.setHgrow(searchBox, Priority.ALWAYS);
        filterBottomRow.getChildren().addAll(
                searchBox,
                requestSearchButton,
                clearFiltersButton
        );
        filters.getChildren().addAll(filterTopRow, filterBottomRow);

        TableView<AdministrativeRequest> table = createRequestsTable();
        Label footer = new Label();
        footer.getStyleClass().add("pagination");
        footer.setPadding(new Insets(4, 0, 0, 0));

        HBox tableFooter = new HBox(8);
        tableFooter.setAlignment(Pos.CENTER_LEFT);
        Region tfSpacer = new Region();
        HBox.setHgrow(tfSpacer, Priority.ALWAYS);
        HBox pageBox = new HBox(4);
        pageBox.setAlignment(Pos.CENTER_RIGHT);
        Label prev = new Label("\u2039");
        prev.getStyleClass().add("pagination-arrow");
        Button one = UIUtils.pageBtn("1", true);
        Button two = UIUtils.pageBtn("2", false);
        Button three = UIUtils.pageBtn("3", false);
        List<Button> pageButtons = List.of(one, two, three);
        Label next = new Label("\u203A");
        next.getStyleClass().add("pagination-arrow");
        pageBox.getChildren().addAll(prev, one, two, three, next);
        tableFooter.getChildren().addAll(footer, tfSpacer, pageBox);

        final int pageSize = 20;
        final int[] currentPage = {1};
        final int[] totalPages = {1};
        final List<AdministrativeRequest>[] currentData = new List[]{new ArrayList<>()};

        Runnable renderPage = () -> {
            int total = currentData[0].size();
            totalPages[0] = Math.max(1, (int) Math.ceil(total / (double) pageSize));
            currentPage[0] = Math.max(1, Math.min(currentPage[0], totalPages[0]));
            List<AdministrativeRequest> pageRows = UIUtils.pageSliceRequests(currentData[0], currentPage[0], pageSize);
            table.setItems(FXCollections.observableArrayList(pageRows));
            int from = total == 0 ? 0 : ((currentPage[0] - 1) * pageSize) + 1;
            int to = Math.min(currentPage[0] * pageSize, total);
            footer.setText("Mostrando " + from + " a " + to + " de " + total + " registros visibles");
            updateRequestPageButtons(pageButtons, currentPage[0], totalPages[0]);
        };

        Runnable refresh = () -> {
            String filter = search.getText() == null ? "" : search.getText().trim().toLowerCase();

            List<AdministrativeRequest> data = requestDAO.list("").stream()
                    .filter(v -> UIUtils.recordType(v).equals(activeType))
                    .filter(v -> !"Licencia maternidad".equals(activeType) || UIUtils.isFemaleRequest(v))
                    .filter(v -> status.getValue() == null || status.getValue().equals("Todos") || recordStatus(v).equals(status.getValue()))
                    .filter(v -> UIUtils.matchesComboFilter(v.getDepartment(), UIUtils.comboText(departmentFilter), "Todas"))
                    .filter(v -> UIUtils.matchesComboFilter(v.getJobTitle(), UIUtils.comboText(jobTitleFilter), "Todos"))
                    .filter(v -> UIUtils.matchesDateRange(v, start.getValue(), end.getValue()))
                    .filter(v -> UIUtils.matchesRequestSearch(v, filter))
                    .collect(Collectors.toList());

            currentData[0] = data;
            currentPage[0] = 1;
            fillRequestSummaryCards(summaryCards, activeType, data);
            renderPage.run();
        };

        activeRequestsRefresh = refresh;
        activeRequestsReset = () -> {
            start.setValue(null);
            end.setValue(null);
            status.setValue("Todos");
            UIUtils.setComboValue(departmentFilter, "Todas");
            UIUtils.setComboValue(jobTitleFilter, "Todos");
            search.clear();
            refresh.run();
        };

        requestSearchButton.setOnAction(e -> refresh.run());
        clearFiltersButton.setOnAction(e -> activeRequestsReset.run());
        search.setOnAction(e -> refresh.run());
        status.setOnAction(e -> refresh.run());
        departmentFilter.setOnAction(e -> refresh.run());
        jobTitleFilter.setOnAction(e -> refresh.run());
        start.setOnAction(e -> refresh.run());
        end.setOnAction(e -> refresh.run());
        for (Button pageButton : pageButtons) {
            pageButton.setOnAction(e -> {
                try {
                    int page = Integer.parseInt(pageButton.getText());
                    if (page >= 1 && page <= totalPages[0]) {
                        currentPage[0] = page;
                        renderPage.run();
                    }
                } catch (NumberFormatException ignored) {}
            });
        }
        prev.setOnMouseClicked(e -> {
            if (currentPage[0] > 1) {
                currentPage[0]--;
                renderPage.run();
            }
        });
        next.setOnMouseClicked(e -> {
            if (currentPage[0] < totalPages[0]) {
                currentPage[0]++;
                renderPage.run();
            }
        });
        newBtn.setOnAction(e -> {
            if (!authDAO.canCreateRequests()) {
                showAlert("Permisos insuficientes", "Tu usuario tiene rol de " + authDAO.getCurrentRole() + ". Puedes consultar y descargar, pero no crear solicitudes.");
                return;
            }
            showNewRequestDialog(table, activeType);
        });
        refresh.run();

        VBox card = new VBox(12, table, tableFooter);
        card.getStyleClass().add("table-card");
        VBox.setVgrow(table, Priority.ALWAYS);
        content.getChildren().addAll(titleRow, summaryCards, filters, card, footerBar());
        shell.getChildren().add(content);
        setCenterPage(shell);
    }

    // ──────────────────────────────────────────────
    //  4. fillRequestSummaryCards
    // ──────────────────────────────────────────────
    public void fillRequestSummaryCards(HBox cards, String activeType, List<AdministrativeRequest> data) {
        long pendientes = data.stream().filter(v -> "Pendiente".equals(recordStatus(v))).count();
        long revision = data.stream().filter(v -> "En revisión".equals(recordStatus(v))).count();
        long aprobadas = data.stream().filter(v -> "Aprobada".equals(recordStatus(v)) || "Finalizada".equals(recordStatus(v))).count();
        cards.getChildren().clear();
        Node c1 = coloredStatCard(UIUtils.iconForType(activeType), "icon-bg-teal", "Total del módulo", UIUtils.format(data.size()), "Registros visibles", "trend-neutral");
        Node c2 = coloredStatCard("/assets/icon_search_unique.png", "icon-bg-blue", "En revisión", UIUtils.format((int) revision), "Requieren validación", "trend-neutral");
        Node c3 = coloredStatCard("/assets/status_pending.png", "icon-bg-orange", "Pendientes", UIUtils.format((int) pendientes), "Por gestionar", "trend-neutral");
        Node c4 = coloredStatCard("/assets/status_approved.png", "icon-bg-green", "Aprobadas/finalizadas", UIUtils.format((int) aprobadas), "Procesadas", "trend-label");
        for (Node c : List.of(c1, c2, c3, c4)) HBox.setHgrow(c, Priority.ALWAYS);
        cards.getChildren().addAll(c1, c2, c3, c4);
    }

    // ──────────────────────────────────────────────
    //  5. requestSummaryCards
    // ──────────────────────────────────────────────
    public HBox requestSummaryCards(String activeType) {
        List<AdministrativeRequest> data = requestDAO.list("").stream()
                .filter(v -> UIUtils.recordType(v).equals(activeType))
                .filter(v -> !"Licencia maternidad".equals(activeType) || UIUtils.isFemaleRequest(v))
                .collect(Collectors.toList());
        HBox cards = new HBox(14);
        cards.setMaxWidth(Double.MAX_VALUE);
        fillRequestSummaryCards(cards, activeType, data);
        return cards;
    }

    // ──────────────────────────────────────────────
    //  6. updateRequestPageButtons
    // ──────────────────────────────────────────────
    public void updateRequestPageButtons(List<Button> buttons, int currentPage, int totalPages) {
        int start = Math.max(1, Math.min(currentPage, Math.max(1, totalPages - buttons.size() + 1)));
        for (int i = 0; i < buttons.size(); i++) {
            int pageNumber = start + i;
            Button btn = buttons.get(i);
            btn.setText(String.valueOf(pageNumber));
            btn.setDisable(pageNumber > totalPages);
            btn.getStyleClass().removeAll("page-btn", "page-btn-inactive");
            btn.getStyleClass().add(pageNumber == currentPage ? "page-btn" : "page-btn-inactive");
        }
    }

    // ──────────────────────────────────────────────
    //  7. createRequestsTable
    // ──────────────────────────────────────────────
    public TableView<AdministrativeRequest> createRequestsTable() {
        TableView<AdministrativeRequest> table = new TableView<>();
        table.getStyleClass().add("requests-table");
        table.setColumnResizePolicy(TableView.UNCONSTRAINED_RESIZE_POLICY);
        table.setPrefHeight(680);
        table.setMinHeight(560);

        UIUtils.addColumn(table, "Radicado", UIUtils::filingNumber, 160);
        UIUtils.addColumn(table, "Tipo", UIUtils::recordType, 165);
        UIUtils.addColumn(table, "Servidor", AdministrativeRequest::getPerson, 280);
        UIUtils.addColumn(table, "Documento", AdministrativeRequest::getDocument, 140);
        UIUtils.addColumn(table, "Dependencia", AdministrativeRequest::getDepartment, 270);
        UIUtils.addColumn(table, "Cargo", AdministrativeRequest::getJobTitle, 250);
        UIUtils.addColumn(table, "Fecha inicio", AdministrativeRequest::getStartDate, 140);
        UIUtils.addColumn(table, "Fecha fin", UIUtils::endDate, 135);
        UIUtils.addColumn(table, "Días", AdministrativeRequest::getTotalDays, 85);

        TableColumn<AdministrativeRequest, String> statusColumn = new TableColumn<>("Estado");
        statusColumn.setCellValueFactory(cell -> new SimpleStringProperty(recordStatus(cell.getValue())));
        statusColumn.setCellFactory(tc -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                    setText(null);
                    return;
                }
                Label text = new Label(item);
                HBox badge = new HBox(6, UIUtils.image(UIUtils.requestStatusAsset(item), 13, 13, true), text);
                badge.setAlignment(Pos.CENTER);
                badge.getStyleClass().add(UIUtils.requestBadgeClass(item));
                setGraphic(badge);
                setText(null);
            }
        });
        statusColumn.setPrefWidth(155);
        table.getColumns().add(statusColumn);

        UIUtils.addColumn(table, "Fecha solicitud", UIUtils::requestDate, 155);

        TableColumn<AdministrativeRequest, String> accionesCol = new TableColumn<>("Acciones");
        accionesCol.setCellValueFactory(cell -> new SimpleStringProperty(""));
        accionesCol.setCellFactory(tc -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getIndex() < 0 || getIndex() >= getTableView().getItems().size()) {
                    setGraphic(null);
                    return;
                }
                AdministrativeRequest row = getTableView().getItems().get(getIndex());
                HBox btns = new HBox(8);
                btns.setAlignment(Pos.CENTER);
                Button eye = UIUtils.actionIconButton("/assets/icon_view.png", "Ver detalle");
                eye.setOnAction(e -> showRequestDetails(row));
                Button edit = UIUtils.actionIconButton("/assets/icon_file.png", authDAO.canEditRequests() ? "Gestionar solicitud" : "Solo lectura");
                edit.setOnAction(e -> showManageRequestDialog(row, getTableView()));
                Button dl = UIUtils.actionIconButton("/assets/icon_download_unique.png", "Descargar soporte");
                dl.setOnAction(e -> downloadRequest(row));
                Button delete = UIUtils.actionIconButton("/assets/status_denied.png", authDAO.canEditRequests() ? "Eliminar solicitud" : "Solo lectura");
                delete.setOnAction(e -> showDeleteRequestDialog(row));
                btns.getChildren().addAll(eye, edit, dl, delete);
                setGraphic(btns);
                setText(null);
            }
        });
        accionesCol.setPrefWidth(178);
        table.getColumns().add(accionesCol);
        return table;
    }

    // ──────────────────────────────────────────────
    //  8. loadRequestsTable
    // ──────────────────────────────────────────────
    public void loadRequestsTable(TableView<AdministrativeRequest> table, Label footer, String filter, String tab, String status, String type) {
        List<AdministrativeRequest> data = requestDAO.list(filter).stream()
                .filter(v -> UIUtils.recordType(v).equals(tab))
                .filter(v -> status == null || status.equals("Todos") || recordStatus(v).equals(status))
                .filter(v -> type == null || type.equals("Todos") || UIUtils.recordType(v).equals(type))
                .collect(Collectors.toList());
        table.setItems(FXCollections.observableArrayList(data));
        footer.setText("Mostrando " + (data.isEmpty() ? 0 : 1) + " a " + data.size() + " de " + data.size() + " registros");
    }

    // ──────────────────────────────────────────────
    //  9. showNewRequestDialog
    // ──────────────────────────────────────────────
    public void showNewRequestDialog(TableView<AdministrativeRequest> table, String defaultType) {
        if (appFrame == null) return;

        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card-large");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_new_form.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox headerTexts = new VBox(3);
        Label title = new Label("Nueva solicitud");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Formulario compacto con datos administrativos, estado inicial y observaciones internas.");
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

        List<Employee> employees = employeeDAO.list("").stream()
                .filter(s -> s.getFullName() != null && !s.getFullName().isBlank())
                .sorted(Comparator.comparing(s -> s.getFullName().toLowerCase()))
                .collect(Collectors.toList());
        Map<String, Employee> employeeByName = new LinkedHashMap<>();
        List<String> names = new ArrayList<>();
        for (Employee employee : employees) {
            String name = UIUtils.upperUi(employee.getFullName());
            String key = UIUtils.normalizeLookup(name);
            if (!employeeByName.containsKey(key)) {
                employeeByName.put(key, employee);
                names.add(name);
            }
        }

        ComboBox<String> person = UIUtils.editableCombo(names, "Nombre completo");
        TextField document = UIUtils.decoratedTextField("Documento");
        ComboBox<String> department = UIUtils.editableCombo(departmentDAO.listDepartmentNames(), "Dependencia");
        ComboBox<String> jobTitle = UIUtils.editableCombo(departmentDAO.listJobTitleNames(), "Cargo");
        DatePicker date = UIUtils.datePicker("Fecha inicio");
        date.setPrefWidth(260);
        TextField days = UIUtils.decoratedTextField("Días solicitados");
        TextArea notes = new TextArea();
        notes.setPromptText("Observaciones, soporte o comentario interno...");
        notes.getStyleClass().add("form-text-area");
        notes.setPrefRowCount(3);
        ComboBox<String> type = new ComboBox<>(FXCollections.observableArrayList("Vacaciones", "Incapacidad", "Permiso", "Licencia maternidad"));
        type.setValue(defaultType == null || defaultType.isBlank() ? "Vacaciones" : defaultType);
        type.getStyleClass().add("combo");
        type.setMaxWidth(Double.MAX_VALUE);
        ComboBox<String> initialStatus = new ComboBox<>(FXCollections.observableArrayList("Pendiente", "En revisión", "Aprobada", "Finalizada", "Rechazada"));
        initialStatus.setValue("Pendiente");
        initialStatus.getStyleClass().add("combo");
        initialStatus.setMaxWidth(Double.MAX_VALUE);

        final String[] lastSuggestedDays = {UIUtils.defaultDaysForType(type.getValue())};
        days.setText(lastSuggestedDays[0]);
        type.setOnAction(e -> {
            String suggested = UIUtils.defaultDaysForType(type.getValue());
            if (days.getText() == null || days.getText().isBlank() || days.getText().trim().equals(lastSuggestedDays[0])) {
                days.setText(suggested);
            }
            lastSuggestedDays[0] = suggested;
        });

        Runnable completeEmployee = () -> UIUtils.populateRequestEmployee(UIUtils.comboText(person), employeeByName, document, department, jobTitle);
        person.setOnAction(e -> completeEmployee.run());

        form.add(UIUtils.formField("Servidor", person), 0, 0);
        form.add(UIUtils.formField("Documento", document), 1, 0);
        form.add(UIUtils.formField("Dependencia", department), 0, 1);
        form.add(UIUtils.formField("Cargo", jobTitle), 1, 1);
        form.add(UIUtils.formField("Fecha inicio", date), 0, 2);
        form.add(UIUtils.formField("Días", days), 1, 2);
        form.add(UIUtils.formField("Tipo", type), 0, 3);
        form.add(UIUtils.formField("Estado inicial", initialStatus), 1, 3);
        form.add(UIUtils.formField("Observaciones", notes), 0, 4, 2, 1);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button save = new Button("Guardar solicitud");
        save.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, save);

        card.getChildren().addAll(header, form, actions);
        StackPane overlay = modalOverlay(card);

        cancel.setOnAction(e -> closeOverlay(overlay));
        save.setOnAction(e -> {
            if (UIUtils.comboText(person).isBlank() || document.getText().isBlank() || UIUtils.comboText(department).isBlank() || date.getValue() == null) {
                showAlert("Formulario incompleto", "Completa mínimo servidor, documento y dependencia.\n\nEl sistema necesita esos datos para crear el radicado y ubicar la solicitud dentro del módulo correcto.");
                return;
            }
            String noteText = "Tipo: " + type.getValue() + " | Estado inicial: " + initialStatus.getValue() + (notes.getText().isBlank() ? "" : " | " + notes.getText());
            int daysCount = UIUtils.parsePositiveDays(days.getText());
            if (daysCount <= 0) {
                showAlert("Días inválidos", "Ingresa un número de días mayor a cero.");
                return;
            }
            Employee selected = employeeByName.get(UIUtils.normalizeLookup(UIUtils.comboText(person)));
            String gender = selected == null ? "" : selected.getGender();
            if (gender != null && !gender.isBlank()) noteText += " | Género: " + gender;
            AdministrativeRequest v = new AdministrativeRequest(0, UIUtils.upperUi(UIUtils.comboText(department)), UIUtils.upperUi(UIUtils.comboText(person)), document.getText(), UIUtils.upperUi(UIUtils.comboText(jobTitle)),
                    UIUtils.formatUiDate(date.getValue()), String.valueOf(daysCount), "Periodo actual", noteText, type.getValue(), initialStatus.getValue(), UIUtils.formatUiDate(LocalDate.now()));
            if ("Licencia maternidad".equals(type.getValue()) && !UIUtils.isFemaleRequest(v)) {
                showAlert("Validación de maternidad", "La licencia por maternidad debe registrarse únicamente para servidoras. Revisa el nombre ingresado antes de guardar.");
                return;
            }
            int newId = requestDAO.createReturningId(v);
            if (newId > 0) {
                closeOverlay(overlay);
                AdministrativeRequest persisted = new AdministrativeRequest(newId, v.getDepartment(), v.getPerson(), v.getDocument(), v.getJobTitle(),
                        v.getStartDate(), v.getTotalDays(), v.getPeriods(), v.getNotes(), v.getRequestType(), v.getStatus(), v.getRequestDate());
                openRequestModule(UIUtils.recordType(persisted));
                showAlert("Solicitud registrada", "La solicitud fue guardada correctamente.\n\nRadicado: " + UIUtils.filingNumber(persisted)
                        + "\nTipo: " + type.getValue()
                        + "\nEstado inicial: " + initialStatus.getValue()
                        + "\nServidor: " + UIUtils.comboText(person)
                        + "\nDependencia: " + UIUtils.comboText(department));
            } else {
                showAlert("No se pudo guardar", "No se pudo guardar la solicitud.\n\nRevisa que la base de datos esté activa.");
            }
        });
    }

    // ──────────────────────────────────────────────
    // 10. showManageRequestDialog
    // ──────────────────────────────────────────────
    public void showManageRequestDialog(AdministrativeRequest v, TableView<AdministrativeRequest> table) {
        if (!authDAO.canEditRequests()) {
            showAlert("Solo lectura", "Tu usuario tiene rol de " + authDAO.getCurrentRole() + ".\n\nPuedes revisar detalles y descargar soportes, pero no cambiar el estado de las solicitudes.");
            return;
        }

        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card-large");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_file.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox texts = new VBox(3);
        Label title = new Label("Gestionar solicitud");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label(UIUtils.filingNumber(v) + " - " + UIUtils.recordType(v));
        subtitle.getStyleClass().add("modal-subtitle");
        texts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, texts);

        List<Employee> employees = employeeDAO.list("").stream()
                .filter(s -> s.getFullName() != null && !s.getFullName().isBlank())
                .sorted(Comparator.comparing(s -> s.getFullName().toLowerCase()))
                .collect(Collectors.toList());
        Map<String, Employee> employeeByName = new LinkedHashMap<>();
        List<String> names = new ArrayList<>();
        for (Employee employee : employees) {
            String name = UIUtils.upperUi(employee.getFullName());
            String key = UIUtils.normalizeLookup(name);
            if (!employeeByName.containsKey(key)) {
                employeeByName.put(key, employee);
                names.add(name);
            }
        }

        GridPane form = new GridPane();
        form.getStyleClass().add("decorated-form");
        form.setHgap(14);
        form.setVgap(12);
        form.setPadding(new Insets(16));
        ColumnConstraints fc1 = new ColumnConstraints(); fc1.setHgrow(Priority.ALWAYS);
        ColumnConstraints fc2 = new ColumnConstraints(); fc2.setHgrow(Priority.ALWAYS); fc2.setPercentWidth(50);
        form.getColumnConstraints().addAll(fc1, fc2);

        ComboBox<String> person = UIUtils.editableCombo(names, "Nombre completo");
        UIUtils.setComboValue(person, v.getPerson());
        TextField document = UIUtils.decoratedTextField("Documento");
        document.setText(v.getDocument() == null ? "" : v.getDocument());
        ComboBox<String> department = UIUtils.editableCombo(departmentDAO.listDepartmentNames(), "Dependencia");
        UIUtils.setComboValue(department, v.getDepartment());
        ComboBox<String> jobTitle = UIUtils.editableCombo(departmentDAO.listJobTitleNames(), "Cargo");
        UIUtils.setComboValue(jobTitle, v.getJobTitle());
        DatePicker startDate = UIUtils.datePicker("Fecha inicio");
        startDate.setPrefWidth(260);
        startDate.setValue(UIUtils.parseUiDate(v.getStartDate()));
        TextField days = UIUtils.decoratedTextField("Días solicitados");
        days.setText(v.getTotalDays() == null ? "" : v.getTotalDays());
        TextField periods = UIUtils.decoratedTextField("Periodo");
        periods.setText(v.getPeriods() == null ? "Periodo actual" : v.getPeriods());
        ComboBox<String> type = new ComboBox<>(FXCollections.observableArrayList("Vacaciones", "Incapacidad", "Permiso", "Licencia maternidad"));
        type.setValue(UIUtils.recordType(v));
        type.getStyleClass().add("combo");
        type.setMaxWidth(Double.MAX_VALUE);
        ComboBox<String> status = new ComboBox<>(FXCollections.observableArrayList("Aprobada", "En revisión", "Finalizada", "Rechazada", "Pendiente"));
        status.setValue(recordStatus(v));
        status.getStyleClass().add("combo");
        status.setMaxWidth(Double.MAX_VALUE);
        TextArea notes = new TextArea();
        notes.setPromptText("Observaciones, soporte o comentario interno...");
        notes.setText(v.getNotes() == null ? "" : v.getNotes());
        notes.getStyleClass().add("form-text-area");
        notes.setPrefRowCount(3);
        TextArea managementNote = new TextArea();
        managementNote.setPromptText("Nota interna de gestión o revisión...");
        managementNote.getStyleClass().add("form-text-area");
        managementNote.setPrefRowCount(2);

        Runnable completeEmployee = () -> UIUtils.populateRequestEmployee(UIUtils.comboText(person), employeeByName, document, department, jobTitle);
        person.setOnAction(e -> completeEmployee.run());

        form.add(UIUtils.formField("Servidor", person), 0, 0);
        form.add(UIUtils.formField("Documento", document), 1, 0);
        form.add(UIUtils.formField("Dependencia", department), 0, 1);
        form.add(UIUtils.formField("Cargo", jobTitle), 1, 1);
        form.add(UIUtils.formField("Fecha inicio", startDate), 0, 2);
        form.add(UIUtils.formField("Días", days), 1, 2);
        form.add(UIUtils.formField("Periodo", periods), 0, 3);
        form.add(UIUtils.formField("Tipo", type), 1, 3);
        form.add(UIUtils.formField("Estado", status), 0, 4);
        form.add(UIUtils.formField("Observaciones", notes), 0, 5, 2, 1);
        form.add(UIUtils.formField("Nota de gestión", managementNote), 0, 6, 2, 1);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button save = new Button("Guardar cambios");
        save.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, save);

        card.getChildren().addAll(header, form, actions);
        StackPane overlay = modalOverlay(card);
        cancel.setOnAction(e -> closeOverlay(overlay));
        save.setOnAction(e -> {
            String personText = UIUtils.comboText(person);
            String departmentText = UIUtils.comboText(department);
            String jobTitleText = UIUtils.comboText(jobTitle);
            String startDateText = UIUtils.formatUiDate(startDate.getValue());
            int daysCount = UIUtils.parsePositiveDays(days.getText());
            if (personText.isBlank() || document.getText().isBlank() || departmentText.isBlank() || startDateText.isBlank()) {
                showAlert("Formulario incompleto", "Completa servidor, documento, dependencia y fecha de inicio.");
                return;
            }
            if (daysCount <= 0) {
                showAlert("Días inválidos", "Ingresa un número de días mayor a cero.");
                return;
            }
            Employee selected = employeeByName.get(UIUtils.normalizeLookup(personText));
            String gender = selected == null ? "" : selected.getGender();
            String noteText = notes.getText() == null ? "" : notes.getText().trim();
            if (gender != null && !gender.isBlank() && !UIUtils.normalizeLookup(noteText).contains("genero:")) {
                noteText += (noteText.isBlank() ? "" : " | ") + "Género: " + gender;
            }
            AdministrativeRequest updated = new AdministrativeRequest(
                    v.getRequestId(),
                    UIUtils.upperUi(departmentText),
                    UIUtils.upperUi(personText),
                    document.getText().trim(),
                    UIUtils.upperUi(jobTitleText),
                    startDateText,
                    String.valueOf(daysCount),
                    periods.getText() == null || periods.getText().isBlank() ? "Periodo actual" : periods.getText().trim(),
                    noteText,
                    type.getValue(),
                    status.getValue(),
                    v.getRequestDate()
            );
            if ("Licencia maternidad".equals(type.getValue()) && !UIUtils.isFemaleRequest(updated)) {
                showAlert("Validación de maternidad", "La licencia por maternidad debe registrarse únicamente para servidoras. Revisa el servidor seleccionado antes de guardar.");
                return;
            }
            if (requestDAO.update(updated, managementNote.getText())) {
                statusOverrides.put(v.getRequestId(), UIUtils.normalizeRequestStatus(status.getValue()));
                closeOverlay(overlay);
                openRequestModule(UIUtils.recordType(updated));
                showAlert("Solicitud actualizada", "La solicitud " + UIUtils.filingNumber(updated) + " fue actualizada correctamente.");
            } else {
                showAlert("No se pudo actualizar", "No se pudo guardar la solicitud.\n\nRevisa la conexión.");
            }
        });
    }

    // ──────────────────────────────────────────────
    // 11. showDeleteRequestDialog
    // ──────────────────────────────────────────────
    public void showDeleteRequestDialog(AdministrativeRequest v) {
        if (!authDAO.canEditRequests()) {
            showAlert("Solo lectura", "Tu usuario tiene rol de " + authDAO.getCurrentRole() + ".\n\nPuedes revisar detalles y descargar soportes, pero no eliminar solicitudes.");
            return;
        }
        if (v == null || v.getRequestId() <= 0) {
            showAlert("No se puede eliminar", "Esta solicitud pertenece a los datos demo y no tiene un registro real asociado en la base de datos.");
            return;
        }

        VBox card = new VBox(16);
        card.getStyleClass().add("modal-card");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/status_denied.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box-danger");
        VBox texts = new VBox(3);
        Label title = new Label("Eliminar solicitud");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label(UIUtils.filingNumber(v) + " - " + UIUtils.recordType(v));
        subtitle.getStyleClass().add("modal-subtitle");
        texts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, texts);

        Label detail = new Label("La solicitud se eliminará de la tabla vacaciones y también del historial asociado, si existe.");
        detail.getStyleClass().add("modal-message");
        detail.setWrapText(true);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button delete = new Button("Eliminar");
        delete.getStyleClass().add("danger-button");
        actions.getChildren().addAll(cancel, delete);

        card.getChildren().addAll(header, detail, actions);
        StackPane overlay = modalOverlay(card);
        cancel.setOnAction(e -> closeOverlay(overlay));
        delete.setOnAction(e -> {
            if (requestDAO.delete(v.getRequestId())) {
                statusOverrides.remove(v.getRequestId());
                closeOverlay(overlay);
                activeRequestsRefresh.run();
                showAlert("Solicitud eliminada", "La solicitud " + UIUtils.filingNumber(v) + " fue eliminada correctamente.");
            } else {
                showAlert("No se pudo eliminar", "No se pudo eliminar la solicitud.\n\nRevisa la conexión.");
            }
        });
    }

    // ──────────────────────────────────────────────
    // 12. showRequestDetails
    // ──────────────────────────────────────────────
    public void showRequestDetails(AdministrativeRequest v) {
        showAlert("Detalle de solicitud", "Radicado: " + UIUtils.filingNumber(v)
                + "\nTipo: " + UIUtils.recordType(v)
                + "\nEstado actual: " + recordStatus(v)
                + "\n\nServidor: " + v.getPerson()
                + "\nDocumento: " + v.getDocument()
                + "\nDependencia: " + v.getDepartment()
                + "\nCargo: " + v.getJobTitle()
                + "\n\nFecha inicio: " + v.getStartDate()
                + "\nFecha fin estimada: " + UIUtils.endDate(v)
                + "\nDías solicitados: " + v.getTotalDays()
                + "\nPeriodo: " + (v.getPeriods() == null || v.getPeriods().isBlank() ? "Periodo actual" : v.getPeriods())
                + "\n\nObservaciones: " + (v.getNotes() == null || v.getNotes().isBlank() ? "Sin observaciones registradas" : v.getNotes()));
    }

    // ──────────────────────────────────────────────
    // 13. downloadRequest
    // ──────────────────────────────────────────────
    public void downloadRequest(AdministrativeRequest v) {
        FileChooser chooser = new FileChooser();
        chooser.setTitle("Descargar soporte");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("Texto", "*.txt"));
        chooser.setInitialFileName(UIUtils.filingNumber(v) + "_soporte.txt");
        File file = chooser.showSaveDialog(stage);
        if (file == null) return;
        try (FileWriter writer = new FileWriter(file, StandardCharsets.UTF_8)) {
            writer.write("TALENTO 360 HUMANO\n");
            writer.write("Gobernación de Boyacá\n\n");
            writer.write("Radicado: " + UIUtils.filingNumber(v) + "\n");
            writer.write("Tipo: " + UIUtils.recordType(v) + "\n");
            writer.write("Servidor: " + v.getPerson() + "\n");
            writer.write("Documento: " + v.getDocument() + "\n");
            writer.write("Dependencia: " + v.getDepartment() + "\n");
            writer.write("Cargo: " + v.getJobTitle() + "\n");
            writer.write("Fecha inicio: " + v.getStartDate() + "\n");
            writer.write("Días: " + v.getTotalDays() + "\n");
            writer.write("Estado: " + recordStatus(v) + "\n");
            showAlert("Descarga lista", "El soporte fue generado correctamente.");
        } catch (Exception e) {
            showAlert("Error", "No se pudo descargar el soporte: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────────
    //  recordStatus (uses this.statusOverrides)
    // ──────────────────────────────────────────────
    private String recordStatus(AdministrativeRequest v) {
        if (v != null && statusOverrides.containsKey(v.getRequestId())) return UIUtils.normalizeRequestStatus(statusOverrides.get(v.getRequestId()));
        if (v != null && v.getStatus() != null && !v.getStatus().isBlank()) return UIUtils.normalizeRequestStatus(v.getStatus());
        int mod = Math.abs(v.getRequestId()) % 5;
        return switch (mod) {
            case 0 -> "Aprobada";
            case 1 -> "Finalizada";
            case 2 -> "Rechazada";
            case 3 -> "En revisión";
            default -> "Pendiente";
        };
    }

    // ──────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────

    private VBox pageShell() {
        VBox shell = new VBox(0);
        shell.getChildren().add(topBar());
        VBox.setVgrow(shell, Priority.ALWAYS);
        return shell;
    }

    private HBox topBar() {
        HBox header = new HBox();
        header.getStyleClass().add("topbar");
        header.setAlignment(Pos.CENTER_LEFT);
        Label title = new Label("Talento 360 Humano");
        title.getStyleClass().add("topbar-title");
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        StackPane avatarStack = new StackPane();
        ImageView avatar = UIUtils.image("/assets/default_avatar.png", 34, 34, true);
        Circle clip = new Circle(17, 17, 17);
        avatar.setClip(clip);
        avatarStack.getChildren().add(avatar);

        MenuItem logout = new MenuItem("Cerrar sesión", UIUtils.image("/assets/icon_logout_unique.png", 16, 16, true));
        logout.setOnAction(e -> showLogoutConfirmation());

        MenuButton userMenu = new MenuButton(authDAO.getCurrentName() + "  •  " + authDAO.getCurrentRole(), avatarStack, logout);
        userMenu.getStyleClass().add("top-user-menu");
        userMenu.setContentDisplay(ContentDisplay.LEFT);
        userMenu.setGraphicTextGap(8);

        header.getChildren().addAll(title, spacer, userMenu);
        return header;
    }

    private HBox footerBar() {
        HBox footer = new HBox();
        footer.setAlignment(Pos.CENTER);
        footer.getStyleClass().add("footer-bar");
        Label fl = new Label("Talento 360 Humano   •   Gobernación de Boyacá   •   2026");
        fl.getStyleClass().add("muted");
        footer.getChildren().add(fl);
        return footer;
    }

    private void setCenterPage(VBox shell) {
        ScrollPane scroll = new ScrollPane(shell);
        scroll.setFitToWidth(true);
        scroll.setFitToHeight(true);
        scroll.getStyleClass().add("main-scroll");
        for (Node node : appFrame.getChildren()) {
            if (node instanceof BorderPane root) {
                root.setCenter(scroll);
                return;
            }
        }
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

    private VBox filterBox(String label, Control control) {
        VBox box = new VBox(5);
        Label l = new Label(label);
        l.getStyleClass().add("field-label");
        control.setMaxWidth(Double.MAX_VALUE);
        box.getChildren().addAll(l, control);
        return box;
    }

    private void showLogoutConfirmation() {
        if (appFrame == null) return;

        VBox card = new VBox(16);
        card.getStyleClass().add("modal-card");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_logout_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box-danger");
        VBox texts = new VBox(3);
        Label title = new Label("¿Cerrar sesión?");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Tu sesión actual se cerrará y volverás a la pantalla de inicio.");
        subtitle.getStyleClass().add("modal-subtitle");
        texts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, texts);

        Label detail = new Label("Antes de salir, verifica que no tengas formularios pendientes o archivos sin exportar.");
        detail.getStyleClass().add("modal-message");
        detail.setWrapText(true);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button logout = new Button("Sí, cerrar sesión");
        logout.getStyleClass().add("danger-button");
        actions.getChildren().addAll(cancel, logout);

        card.getChildren().addAll(header, detail, actions);
        StackPane overlay = modalOverlay(card);
        cancel.setOnAction(e -> closeOverlay(overlay));
        logout.setOnAction(e -> {
            closeOverlay(overlay);
            stage.close();
        });
    }

    private void showAlert(String title, String message) {
        if (appFrame == null) {
            javafx.scene.control.Alert alert = new javafx.scene.control.Alert(javafx.scene.control.Alert.AlertType.INFORMATION);
            alert.setTitle(title);
            alert.setHeaderText(null);
            alert.setContentText(message);
            alert.showAndWait();
            return;
        }

        VBox card = new VBox(16);
        card.getStyleClass().add("modal-card");
        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_incapacity_unique_two.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox texts = new VBox(3);
        Label t = new Label(title);
        t.getStyleClass().add("modal-title");
        Label st = new Label("Información del sistema Talento 360 Humano");
        st.getStyleClass().add("modal-subtitle");
        texts.getChildren().addAll(t, st);
        header.getChildren().addAll(iconBox, texts);

        Label msg = new Label(message);
        msg.getStyleClass().add("modal-message");
        msg.setWrapText(true);
        msg.setMaxWidth(520);

        HBox actions = new HBox();
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button ok = new Button("Entendido");
        ok.getStyleClass().add("green-button");
        actions.getChildren().add(ok);

        card.getChildren().addAll(header, msg, actions);
        StackPane overlay = modalOverlay(card);
        ok.setOnAction(e -> closeOverlay(overlay));
    }

    private StackPane modalOverlay(VBox card) {
        boolean large = card.getStyleClass().contains("modal-card-large");
        card.setPrefWidth(large ? 760 : 520);
        card.setMaxWidth(Region.USE_PREF_SIZE);
        card.setMaxHeight(Region.USE_PREF_SIZE);
        card.setMinHeight(Region.USE_PREF_SIZE);

        StackPane overlay = new StackPane(card);
        overlay.getStyleClass().add("modal-overlay");
        overlay.setAlignment(Pos.CENTER);
        appFrame.getChildren().add(overlay);
        return overlay;
    }

    private void closeOverlay(StackPane overlay) {
        if (appFrame != null && overlay != null) {
            appFrame.getChildren().remove(overlay);
        }
    }
}
