package com.talento360.controllers;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.prefs.Preferences;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.talento360.dao.AuthDAO;
import com.talento360.dao.DepartmentDAO;
import com.talento360.dao.EmployeeDAO;
import com.talento360.models.Employee;
import com.talento360.utils.UIUtils;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.ContentDisplay;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Separator;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.scene.control.OverrunStyle;
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
import javafx.scene.shape.Rectangle;

public class ProfileController {

    private static final DateTimeFormatter UI_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final StackPane appFrame;
    private final AuthDAO authDAO;
    private final EmployeeDAO employeeDAO;
    private final DepartmentDAO departmentDAO;

    public ProfileController(StackPane appFrame, AuthDAO authDAO, EmployeeDAO employeeDAO) {
        this.appFrame = appFrame;
        this.authDAO = authDAO;
        this.employeeDAO = employeeDAO;
        this.departmentDAO = new DepartmentDAO();
    }

    public void setProfileView() {
        VBox shell = pageShell();
        VBox content = new VBox(16);
        content.getStyleClass().add("page-content");

        HBox titleRow = new HBox(12);
        titleRow.setAlignment(Pos.CENTER_LEFT);
        VBox titleBox = new VBox(2);
        Label title = new Label("Resumen de perfil");
        title.getStyleClass().add("hero-title");
        titleBox.getChildren().add(title);
        Region titleSpacer = new Region();
        HBox.setHgrow(titleSpacer, Priority.ALWAYS);
        Button newUserButton = new Button("  Nuevo usuario");
        newUserButton.setGraphic(UIUtils.image("/assets/icon_plus_unique.png", 17, 17, true));
        newUserButton.getStyleClass().add("green-button");
        titleRow.getChildren().addAll(titleBox, titleSpacer, newUserButton);

        VBox searchCard = new VBox(12);
        searchCard.getStyleClass().addAll("search-card", "search-card-profile");
        HBox searchRow = new HBox(12);
        searchRow.setAlignment(Pos.CENTER_LEFT);
        Label searchIcon = new Label("\ud83d\udd0d");
        searchIcon.setStyle("-fx-font-size: 16px; -fx-text-fill: #4a5a75;");
        TextField search = new TextField();
        search.setPromptText("Buscar por nombre, c\u00e9dula, dependencia o cargo...");
        search.getStyleClass().add("input");
        search.setPrefWidth(500);
        HBox.setHgrow(search, Priority.ALWAYS);
        Button searchButton = new Button("Buscar");
        searchButton.getStyleClass().add("primary-button");
        searchRow.getChildren().addAll(searchIcon, search, searchButton);

        TableView<Employee> table = createEmployeeTable(employeeDAO.list(""));
        table.setMinHeight(260);
        table.setPrefHeight(320);
        table.setMaxHeight(360);
        VBox.setVgrow(table, Priority.NEVER);
        searchCard.setMinHeight(0);

        Rectangle clip = new Rectangle();
        clip.setArcWidth(20);
        clip.setArcHeight(20);
        clip.widthProperty().bind(searchCard.widthProperty());
        clip.heightProperty().bind(searchCard.heightProperty());
        searchCard.setClip(clip);

        searchCard.getChildren().addAll(searchRow, table);

        VBox details = new VBox(16);
        details.setPadding(new Insets(8, 0, 0, 0));

        Runnable selectFirst = () -> {
            if (!table.getItems().isEmpty()) table.getSelectionModel().select(0);
            else details.getChildren().setAll(UIUtils.emptyProfileCard());
        };

        table.getSelectionModel().selectedItemProperty().addListener((noteText, old, selected) -> {
            if (selected != null) details.getChildren().setAll(buildProfileContent(selected));
        });

        searchButton.setOnAction(e -> {
            List<Employee> result = employeeDAO.list(search.getText());
            table.setItems(FXCollections.observableArrayList(result));
            selectFirst.run();
        });
        newUserButton.setOnAction(e -> showNewUserDialog(table, details, search));
        search.setOnAction(e -> searchButton.fire());
        selectFirst.run();

        content.getChildren().addAll(titleRow, searchCard, details);
        shell.getChildren().add(content);
        setCenterPage(shell);
    }

    public void showNewUserDialog(TableView<Employee> table, VBox details, TextField search) {
        if (appFrame == null) return;

        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card-large");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_profile_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox headerTexts = new VBox(3);
        Label title = new Label("Nuevo usuario");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Registra un servidor en perfiles y guarda la relacion principal en la base de datos.");
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
        TextField document = UIUtils.decoratedTextField("C\u00e9dula");
        ComboBox<String> department = UIUtils.editableCombo(departmentDAO.listDepartmentNames(), "Dependencia");
        ComboBox<String> jobTitle = UIUtils.editableCombo(departmentDAO.listJobTitleNames(), "Cargo");
        ComboBox<String> gender = new ComboBox<>(FXCollections.observableArrayList("F", "M", "NO REGISTRADO"));
        gender.setValue("NO REGISTRADO");
        gender.getStyleClass().add("combo");
        gender.setMaxWidth(Double.MAX_VALUE);
        ComboBox<String> status = new ComboBox<>(FXCollections.observableArrayList("ACTIVO", "ENCARGO", "PROVISIONAL", "RETIRADO"));
        status.setValue("ACTIVO");
        status.getStyleClass().add("combo");
        status.setMaxWidth(Double.MAX_VALUE);
        DatePicker startDate = UIUtils.datePicker("Fecha de ingreso");
        startDate.setPrefWidth(220);
        TextField email = UIUtils.decoratedTextField("Correo");
        TextField phone = UIUtils.decoratedTextField("Celular");

        form.add(UIUtils.formField("Nombre completo", fullName), 0, 0);
        form.add(UIUtils.formField("C\u00e9dula", document), 1, 0);
        form.add(UIUtils.formField("Dependencia", department), 0, 1);
        form.add(UIUtils.formField("Cargo", jobTitle), 1, 1);
        form.add(UIUtils.formField("G\u00e9nero", gender), 0, 2);
        form.add(UIUtils.formField("Situaci\u00f3n", status), 1, 2);
        form.add(UIUtils.formField("Fecha de ingreso", startDate), 0, 3);
        form.add(UIUtils.formField("Correo", email), 1, 3);
        form.add(UIUtils.formField("Celular", phone), 0, 4);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button save = new Button("Guardar usuario");
        save.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, save);

        card.getChildren().addAll(header, form, actions);
        StackPane overlay = modalOverlay(card);

        cancel.setOnAction(e -> closeOverlay(overlay));
        save.setOnAction(e -> {
            String fullNameText = fullName.getText() == null ? "" : fullName.getText().trim();
            String documentText = document.getText() == null ? "" : document.getText().trim();
            String departmentText = UIUtils.comboText(department);
            String jobTitleText = UIUtils.comboText(jobTitle);
            if (fullNameText.isBlank() || documentText.isBlank() || departmentText.isBlank() || jobTitleText.isBlank()) {
                showAlert("Formulario incompleto", "Completa nombre, c\u00e9dula, dependencia y cargo antes de guardar.");
                return;
            }
            if (employeeDAO.documentExists(documentText)) {
                showAlert("Usuario existente", "Ya existe un perfil con la c\u00e9dula " + documentText + ".");
                return;
            }
            Employee employee = new Employee(
                    "",
                    documentText,
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
            if (employeeDAO.create(employee)) {
                closeOverlay(overlay);
                search.setText("");
                List<Employee> result = employeeDAO.list("");
                table.setItems(FXCollections.observableArrayList(result));
                UIUtils.selectEmployeeByDocument(table, details, documentText);
                showAlert("Usuario registrado", "El usuario fue guardado correctamente.\n\nNombre: " + UIUtils.upperUi(fullNameText) + "\nCedula: " + documentText);
            } else {
                showAlert("No se pudo guardar", "No se pudo guardar el usuario en la base de datos. Revisa la conexi\u00f3n, el script final y que la c\u00e9dula no exista.");
            }
        });
    }

    public void showEditUserDialog(TableView<Employee> table, VBox details, Employee existing) {
        if (appFrame == null || existing == null) return;
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
        TextField document = UIUtils.decoratedTextField("C\u00e9dula");
        document.setText(existing.getDocumentId());
        document.setDisable(true);
        ComboBox<String> department = UIUtils.editableCombo(departmentDAO.listDepartmentNames(), "Dependencia");
        UIUtils.setComboValue(department, existing.getDepartment());
        ComboBox<String> jobTitle = UIUtils.editableCombo(departmentDAO.listJobTitleNames(), "Cargo");
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
        form.add(UIUtils.formField("C\u00e9dula", document), 1, 0);
        form.add(UIUtils.formField("Dependencia", department), 0, 1);
        form.add(UIUtils.formField("Cargo", jobTitle), 1, 1);
        form.add(UIUtils.formField("G\u00e9nero", gender), 0, 2);
        form.add(UIUtils.formField("Situaci\u00f3n", status), 1, 2);
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
        StackPane overlay = modalOverlay(card);

        cancel.setOnAction(e -> closeOverlay(overlay));
        save.setOnAction(e -> {
            String fullNameText = fullName.getText() == null ? "" : fullName.getText().trim();
            String departmentText = UIUtils.comboText(department);
            String jobTitleText = UIUtils.comboText(jobTitle);
            if (fullNameText.isBlank() || departmentText.isBlank() || jobTitleText.isBlank()) {
                showAlert("Formulario incompleto", "Completa nombre, dependencia y cargo antes de guardar.");
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
            if (employeeDAO.update(updated)) {
                closeOverlay(overlay);
                List<Employee> result = employeeDAO.list("");
                if (table != null) table.setItems(FXCollections.observableArrayList(result));
                if (table != null) UIUtils.selectEmployeeByDocument(table, details, updated.getDocumentId());
                showAlert("Usuario actualizado", "Los datos del usuario fueron actualizados correctamente.");
            } else {
                showAlert("No se pudo actualizar", "Ocurri\u00f3 un error al actualizar el usuario en la base de datos.");
            }
        });
    }

    public void showDeleteUserDialog(Employee existing, TableView<Employee> table, VBox details) {
        if (appFrame == null || existing == null) return;
        VBox card = new VBox(12);
        card.getStyleClass().add("modal-card");
        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/status_denied.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box-danger");
        VBox texts = new VBox(3);
        Label title = new Label("Eliminar usuario");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("\u00bfEst\u00e1s seguro de eliminar el perfil de \"" + existing.getFullName() + "\"? Esta acci\u00f3n remover\u00e1 la relaci\u00f3n principal del sistema.");
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
        StackPane overlay = modalOverlay(card);
        cancel.setOnAction(e -> closeOverlay(overlay));
        del.setOnAction(e -> {
            if (employeeDAO.deleteByDocument(existing.getDocumentId())) {
                closeOverlay(overlay);
                if (table != null) table.setItems(FXCollections.observableArrayList(employeeDAO.list("")));
                if (details != null) details.getChildren().setAll(UIUtils.emptyProfileCard());
                showAlert("Usuario eliminado", "El perfil fue eliminado correctamente (relaci\u00f3n principal removida).");
            } else {
                showAlert("No se pudo eliminar", "No se pudo eliminar el perfil. Es posible que no exista o que la base de datos devuelva una restricci\u00f3n.");
            }
        });
    }

    public void showSelectEmployeeDialog(Label nameLabel, Label roleLabel) {
        if (appFrame == null) return;
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

        TextField search = UIUtils.decoratedTextField("Buscar por nombre, c\u00e9dula, dependencia o cargo...");
        HBox searchRow = new HBox(10, search);
        searchRow.setAlignment(Pos.CENTER_LEFT);

        TableView<Employee> table = createEmployeeTable(employeeDAO.list(""));
        table.setPrefHeight(360);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button select = new Button("Seleccionar");
        select.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, select);

        card.getChildren().addAll(header, searchRow, table, actions);
        StackPane overlay = modalOverlay(card);

        cancel.setOnAction(e -> closeOverlay(overlay));
        select.setOnAction(e -> {
            Employee sel = table.getSelectionModel().getSelectedItem();
            if (sel == null) { showAlert("Sin selecci\u00f3n", "Selecciona un empleado de la lista."); return; }
            nameLabel.setText(sel.getFullName());
            roleLabel.setText(sel.getCurrentJobTitle());
            try {
                Preferences prefs = Preferences.userNodeForPackage(com.talento360.MainApp.class);
                prefs.put("employee_of_month_doc", sel.getDocumentId() == null ? "" : sel.getDocumentId());
            } catch (Exception ex) {
            }
            closeOverlay(overlay);
        });

        search.setOnAction(e -> {
            List<Employee> res = employeeDAO.list(search.getText());
            table.setItems(FXCollections.observableArrayList(res));
            if (!res.isEmpty()) table.getSelectionModel().select(0);
        });
        search.setOnKeyReleased(e -> {
            List<Employee> res = employeeDAO.list(search.getText());
            table.setItems(FXCollections.observableArrayList(res));
            if (!res.isEmpty()) table.getSelectionModel().select(0);
        });
    }

    public void showMonthPickerDialog(Label empMonth) {
        if (appFrame == null || empMonth == null) return;
        VBox card = new VBox(12);
        card.getStyleClass().add("modal-card");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_calendar_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox texts = new VBox(3);
        Label title = new Label("Editar mes del reconocimiento");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Selecciona el mes y a\u00f1o que aparecer\u00e1n en la tarjeta.");
        subtitle.getStyleClass().add("modal-subtitle");
        texts.getChildren().addAll(title, subtitle);
        header.getChildren().addAll(iconBox, texts);

        ComboBox<String> months = new ComboBox<>(FXCollections.observableArrayList(
                List.of("ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE")
        ));
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
        StackPane overlay = modalOverlay(card);

        cancel.setOnAction(e -> closeOverlay(overlay));
        save.setOnAction(e -> {
            String m = months.getValue() == null ? months.getItems().get(LocalDate.now().getMonthValue() - 1) : months.getValue();
            Integer y = years.getValue() == null ? LocalDate.now().getYear() : years.getValue();
            String current = empMonth.getText() == null ? "" : empMonth.getText().toLowerCase();
            if (current.contains("empleado")) {
                empMonth.setText("Empleado del mes de " + UIUtils.lowerUi(m) + " " + y);
            } else {
                empMonth.setText(m + " " + y);
            }
            try {
                Preferences prefs = Preferences.userNodeForPackage(com.talento360.MainApp.class);
                prefs.put("employee_of_month_text", empMonth.getText());
            } catch (Exception ex) {
            }
            closeOverlay(overlay);
        });
    }

    public Employee findEmployeeByFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) return null;
        List<Employee> candidates = employeeDAO.list(fullName);
        for (Employee e : candidates) {
            if (e.getFullName() != null && e.getFullName().equalsIgnoreCase(fullName.trim())) return e;
        }
        return candidates.isEmpty() ? null : candidates.get(0);
    }

    public TableView<Employee> createEmployeeTable(List<Employee> employees) {
        TableView<Employee> table = new TableView<>(FXCollections.observableArrayList(employees));
        table.getStyleClass().add("profile-search-table");
        table.getStyleClass().add("perfil-summary-table");
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        UIUtils.addColumn(table, "C\u00e9dula", Employee::getDocumentId, 125);
        UIUtils.addColumn(table, "Nombre", Employee::getFullName, 240);
        UIUtils.addColumn(table, "Dependencia", Employee::getDepartment, 260);
        UIUtils.addColumn(table, "Cargo actual", Employee::getCurrentJobTitle, 220);

        TableColumn<Employee, String> statusCol = new TableColumn<>("Situaci\u00f3n");
        statusCol.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().getEmploymentStatus()));
        statusCol.setCellFactory(tc -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setGraphic(null); setText(null); return; }
                setGraphic(statusBadge(item.toUpperCase(), UIUtils.employeeStatusBadgeClass(item)));
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

    public VBox buildProfileContent(Employee selected) {
        VBox box = new VBox(16);
        box.setMaxWidth(Double.MAX_VALUE);
        HBox cards = new HBox(16);
        cards.setMaxWidth(Double.MAX_VALUE);
        VBox personalInfo = infoCard("/assets/icon_profile_unique.png", "Informaci\u00f3n personal",
                UIUtils.row("Documento de identidad", UIUtils.value(selected, Employee::getDocumentId)),
                UIUtils.row("Fecha de nacimiento", "No registrada"),
                UIUtils.row("Lugar de nacimiento", "Tunja, Boyac\u00e1"),
                UIUtils.row("G\u00e9nero", UIUtils.value(selected, Employee::getGender)),
                UIUtils.row("Estado civil", "No registrado")
        );
        VBox workInfo = infoCard("/assets/icon_labor_unique.png", "Informaci\u00f3n laboral",
                UIUtils.row("Dependencia", UIUtils.value(selected, Employee::getDepartment)),
                UIUtils.row("Cargo", UIUtils.value(selected, Employee::getCurrentJobTitle)),
                UIUtils.row("Cargo base", UIUtils.value(selected, Employee::getBaseJobTitle)),
                UIUtils.row("Fecha de ingreso", UIUtils.value(selected, Employee::getStartDate)),
                UIUtils.row("Tipo de vinculaci\u00f3n", UIUtils.value(selected, Employee::getEmploymentStatus))
        );
        VBox contactInfo = infoCard("/assets/icon_contact_unique.png", "Informaci\u00f3n de contacto",
                UIUtils.row("Correo", UIUtils.value(selected, Employee::getEmail)),
                UIUtils.row("Correo personal", "No registrado"),
                UIUtils.row("Tel\u00e9fono celular", UIUtils.value(selected, Employee::getPhone)),
                UIUtils.row("Tel\u00e9fono fijo", "No registrado"),
                UIUtils.row("Ciudad", "Tunja, Boyac\u00e1")
        );
        for (VBox c : List.of(personalInfo, workInfo, contactInfo)) HBox.setHgrow(c, Priority.ALWAYS);
        cards.getChildren().addAll(personalInfo, workInfo, contactInfo);
        box.getChildren().addAll(profileHeader(selected), cards);
        return box;
    }

    public VBox profileHeader(Employee s) {
        HBox header = new HBox(22);
        header.getStyleClass().add("profile-hero");
        header.setAlignment(Pos.CENTER_LEFT);

        StackPane avatarStack = new StackPane();
        ImageView avatar = UIUtils.image("/assets/default_avatar.png", 100, 100, true);
        avatarStack.getChildren().add(avatar);

        VBox person = new VBox(7);
        Label name = new Label(UIUtils.value(s, Employee::getFullName));
        name.getStyleClass().add("profile-name");
        Label jobTitle = new Label(UIUtils.value(s, Employee::getCurrentJobTitle));
        jobTitle.getStyleClass().add("profile-sub");

        HBox depRow = new HBox(6);
        depRow.setAlignment(Pos.CENTER_LEFT);
        ImageView buildingIcon = UIUtils.image("/assets/icon_dependencias_unique.png", 15, 15, true);
        Label dep = new Label(UIUtils.value(s, Employee::getDepartment));
        dep.getStyleClass().add("profile-sub");
        depRow.getChildren().addAll(buildingIcon, dep);

        Label active = statusBadge(UIUtils.value(s, Employee::getEmploymentStatus).toUpperCase(), UIUtils.profileStatusClass(UIUtils.value(s, Employee::getEmploymentStatus)));
        person.getChildren().addAll(name, jobTitle, depRow, active);

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        VBox meta = new VBox(14);
        meta.setAlignment(Pos.CENTER_RIGHT);
        meta.getChildren().addAll(
                metaRow("/assets/icon_calendar_unique.png", "Fecha de ingreso", UIUtils.value(s, Employee::getStartDate)),
                metaRow("/assets/icon_link_unique.png", "Tipo de vinculaci\u00f3n", UIUtils.value(s, Employee::getEmploymentStatus))
        );
        header.getChildren().addAll(avatarStack, person, spacer, meta);
        return new VBox(header);
    }

    public Label statusBadge(String text, String styleClass) {
        String cleanText = text == null || text.isBlank() ? "NO REGISTRADO" : text.toUpperCase();

        Label badge = new Label(cleanText);
        badge.getStyleClass().add(styleClass);

        ImageView statusIcon = UIUtils.image(UIUtils.statusAssetPath(cleanText), 14, 14, true);

        if (statusIcon.getImage() == null) {
            StackPane assetSlot = new StackPane();
            assetSlot.getStyleClass().add("status-asset-slot");
            assetSlot.setMinSize(14, 14);
            assetSlot.setPrefSize(14, 14);
            assetSlot.setMaxSize(14, 14);
            badge.setGraphic(assetSlot);
        } else {
            badge.setGraphic(statusIcon);
        }

        badge.setGraphicTextGap(7);
        return badge;
    }

    public VBox historyCard(Employee selected) {
        VBox history = new VBox(10);
        history.getStyleClass().add("info-card-wide");

        HBox titleRow = new HBox(8);
        titleRow.setAlignment(Pos.CENTER_LEFT);
        ImageView clockIcon = UIUtils.image("/assets/icon_history_unique.png", 22, 22, true);
        Label histTitle = UIUtils.sectionLabel("Historial reciente");
        titleRow.getChildren().addAll(clockIcon, histTitle);

        Separator sep = new Separator();
        sep.getStyleClass().add("gold-separator");

        TableView<Map<String, String>> historyTable = UIUtils.createHistoryTable(UIUtils.recentHistoryFor(selected));
        historyTable.setPrefHeight(240);
        history.getChildren().addAll(titleRow, sep, historyTable);
        return history;
    }

    private void showAlert(String title, String message) {
        if (appFrame == null) {
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
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
        Label st = new Label("Informaci\u00f3n del sistema Talento 360 Humano");
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

        MenuItem logout = new MenuItem("Cerrar sesi\u00f3n", UIUtils.image("/assets/icon_logout_unique.png", 16, 16, true));

        MenuButton userMenu = new MenuButton(authDAO.getCurrentName() + "  \u2022  " + authDAO.getCurrentRole(), avatarStack, logout);
        userMenu.getStyleClass().add("top-user-menu");
        userMenu.setContentDisplay(ContentDisplay.LEFT);
        userMenu.setGraphicTextGap(8);

        header.getChildren().addAll(title, spacer, userMenu);
        return header;
    }

    private VBox pageShell() {
        VBox shell = new VBox(0);
        shell.getChildren().add(topBar());
        VBox.setVgrow(shell, Priority.ALWAYS);
        return shell;
    }

    private void setCenterPage(VBox shell) {
        ScrollPane scroll = new ScrollPane(shell);
        scroll.setFitToWidth(true);
        scroll.setFitToHeight(true);
        scroll.getStyleClass().add("main-scroll");
        BorderPane root = (BorderPane) appFrame.getChildren().get(0);
        root.setCenter(scroll);
    }

    private HBox footerBar() {
        HBox footer = new HBox();
        footer.setAlignment(Pos.CENTER);
        footer.getStyleClass().add("footer-bar");
        Label fl = new Label("Talento 360 Humano   \u2022   Gobernaci\u00f3n de Boyac\u00e1   \u2022   2026");
        fl.getStyleClass().add("muted");
        footer.getChildren().add(fl);
        return footer;
    }

    private HBox metaRow(String iconPath, String label, String val) {
        ImageView icon = UIUtils.image(iconPath, 25, 25, true);
        VBox texts = new VBox(3);
        Label l = new Label(label);
        l.getStyleClass().add("meta-label");
        Label v = new Label(val);
        v.getStyleClass().add("meta-value");
        texts.getChildren().addAll(l, v);
        return new HBox(10, icon, texts);
    }

    private VBox infoCard(String iconPath, String title, HBox... rows) {
        VBox card = new VBox(10);
        card.getStyleClass().add("info-card");
        card.setMaxWidth(Double.MAX_VALUE);
        HBox heading = new HBox(8);
        heading.setAlignment(Pos.CENTER_LEFT);
        heading.getChildren().addAll(UIUtils.image(iconPath, 22, 22, true), UIUtils.sectionLabel(title));
        Separator sep = new Separator();
        sep.getStyleClass().add("gold-separator");
        sep.setPadding(new Insets(2, 0, 4, 0));
        card.getChildren().add(heading);
        card.getChildren().add(sep);
        card.getChildren().addAll(rows);
        return card;
    }
}
