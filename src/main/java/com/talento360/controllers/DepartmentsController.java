package com.talento360.controllers;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import javafx.scene.control.Label;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Separator;
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

public class DepartmentsController {

    private final StackPane appFrame;
    private final AuthDAO authDAO;
    private final DepartmentDAO departmentDAO;
    private final EmployeeDAO employeeDAO;

    public DepartmentsController(StackPane appFrame, AuthDAO authDAO, DepartmentDAO departmentDAO) {
        this.appFrame = appFrame;
        this.authDAO = authDAO;
        this.departmentDAO = departmentDAO;
        this.employeeDAO = new EmployeeDAO();
    }

    public void setDepartmentsView() {
        VBox shell = pageShell();
        VBox content = new VBox(16);
        content.getStyleClass().add("page-content");

        HBox titleRow = new HBox(12);
        titleRow.setAlignment(Pos.CENTER_LEFT);
        VBox titleBox = new VBox(4);
        Label title = new Label("Dependencias");
        title.getStyleClass().add("hero-title");
        Label subtitle = new Label("Consulta r\u00e1pida de perfiles directivos demo seg\u00fan la estructura general de secretar\u00edas y \u00e1reas de la Gobernaci\u00f3n de Boyac\u00e1.");
        subtitle.getStyleClass().add("hero-subtitle");
        titleBox.getChildren().addAll(title, subtitle);
        Region titleSpacer = new Region();
        HBox.setHgrow(titleSpacer, Priority.ALWAYS);
        Button addDepartmentButton = new Button("  Agregar dependencia");
        addDepartmentButton.setGraphic(UIUtils.image("/assets/icon_plus_unique.png", 17, 17, true));
        addDepartmentButton.getStyleClass().add("green-button");
        titleRow.getChildren().addAll(titleBox, titleSpacer, addDepartmentButton);

        VBox searchCard = new VBox(12);
        searchCard.getStyleClass().add("search-card");
        HBox searchRow = new HBox(12);
        searchRow.setAlignment(Pos.CENTER_LEFT);
        Label searchIcon = new Label("\ud83d\udd0d");
        searchIcon.setStyle("-fx-font-size: 18px; -fx-text-fill: #23425f;");
        TextField search = new TextField();
        search.setPromptText("Buscar por dependencia, cargo, nombre o correo...");
        search.getStyleClass().add("input");
        HBox.setHgrow(search, Priority.ALWAYS);
        Button searchButton = new Button("Buscar");
        searchButton.getStyleClass().add("primary-button");
        searchRow.getChildren().addAll(searchIcon, search, searchButton);

        VBox details = new VBox(16);
        TableView<Map<String, String>> table = createManagersTable(departmentsData(""));
        table.setPrefHeight(500);

        searchCard.getChildren().addAll(searchRow, table);

        Runnable selectFirst = () -> {
            if (!table.getItems().isEmpty()) table.getSelectionModel().select(0);
            else details.getChildren().setAll(UIUtils.emptyManagerCard());
        };

        table.getSelectionModel().selectedItemProperty().addListener((noteText, old, selected) -> {
            if (selected != null) details.getChildren().setAll(buildManagerProfile(selected));
        });

        searchButton.setOnAction(e -> {
            table.setItems(FXCollections.observableArrayList(departmentsData(search.getText())));
            selectFirst.run();
        });
        addDepartmentButton.setOnAction(e -> showAddDepartmentDialog(table, details, search));
        search.setOnAction(e -> searchButton.fire());
        selectFirst.run();

        content.getChildren().addAll(titleRow, searchCard, details, footerBar());
        shell.getChildren().add(content);
        setCenterPage(shell);
    }

    private void showAddDepartmentDialog(TableView<Map<String, String>> table, VBox details, TextField search) {
        if (appFrame == null) return;

        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card-large");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_dependencias_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox headerTexts = new VBox(3);
        Label title = new Label("Agregar dependencia");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Crea una nueva dependencia en el catalogo institucional.");
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

        TextField dependencyName = UIUtils.decoratedTextField("Nombre de la dependencia");

        List<Employee> employees = employeeDAO.list("").stream()
                .filter(s -> s.getFullName() != null && !s.getFullName().isBlank())
                .sorted(Comparator.comparing(s -> s.getFullName().toLowerCase()))
                .collect(Collectors.toList());
        Map<String, Employee> employeeByName = new LinkedHashMap<>();
        List<String> names = new ArrayList<>();
        for (Employee emp : employees) {
            String n = UIUtils.upperUi(emp.getFullName());
            String key = UIUtils.normalizeLookup(n);
            if (!employeeByName.containsKey(key)) {
                employeeByName.put(key, emp);
                names.add(n);
            }
        }

        ComboBox<String> managerName = UIUtils.editableCombo(names, "Responsable institucional");
        ComboBox<String> managerJob = UIUtils.editableCombo(departmentDAO.listJobTitleNames(), "Cargo directivo");
        TextField managerEmail = UIUtils.decoratedTextField("Correo (opcional)");
        TextField managerExt = UIUtils.decoratedTextField("Extensi\u00f3n telef\u00f3nica (opcional)");
        TextArea funciones = new TextArea();
        funciones.setPromptText("Funciones resumidas de la dependencia...");
        funciones.getStyleClass().add("form-text-area");
        funciones.setPrefRowCount(3);

        managerName.setOnAction(ev -> {
            String sel = UIUtils.comboText(managerName);
            Employee e = employeeByName.get(UIUtils.normalizeLookup(sel));
            if (e != null) {
                if (e.getEmail() != null && !e.getEmail().isBlank()) managerEmail.setText(e.getEmail());
                if (e.getPhone() != null && !e.getPhone().isBlank()) managerExt.setText(e.getPhone());
                UIUtils.setComboValue(managerJob, e.getCurrentJobTitle());
            }
        });

        form.add(UIUtils.formField("Dependencia", dependencyName), 0, 0);
        form.add(UIUtils.formField("Responsable", managerName), 1, 0);
        form.add(UIUtils.formField("Cargo directivo", managerJob), 0, 1);
        form.add(UIUtils.formField("Correo responsable", managerEmail), 1, 1);
        form.add(UIUtils.formField("Extensi\u00f3n", managerExt), 0, 2);
        form.add(UIUtils.formField("Funciones", funciones), 0, 3, 2, 1);

        HBox actions = new HBox(10);
        actions.setAlignment(Pos.CENTER_RIGHT);
        Button cancel = new Button("Cancelar");
        cancel.getStyleClass().add("secondary-button");
        Button save = new Button("Guardar dependencia");
        save.getStyleClass().add("green-button");
        actions.getChildren().addAll(cancel, save);

        card.getChildren().addAll(header, form, actions);
        StackPane overlay = modalOverlay(card);

        cancel.setOnAction(e -> closeOverlay(overlay));
        save.setOnAction(e -> {
            String value = dependencyName.getText() == null ? "" : dependencyName.getText().trim();
            if (value.isBlank()) {
                showAlert("Formulario incompleto", "Ingresa el nombre de la dependencia.");
                return;
            }
            String responsable = UIUtils.comboText(managerName);
            String cargo = UIUtils.comboText(managerJob);
            String correo = managerEmail.getText() == null ? "" : managerEmail.getText().trim();
            String extension = managerExt.getText() == null ? "" : managerExt.getText().trim();
            String funciones_text = funciones.getText() == null ? "" : funciones.getText().trim();

            if (departmentDAO.createFull(value, responsable, cargo, correo, extension, funciones_text)) {
                closeOverlay(overlay);
                search.setText("");
                table.setItems(FXCollections.observableArrayList(departmentsData("")));
                selectDepartmentByName(table, details, value);
                showAlert("Dependencia registrada", "La dependencia fue guardada correctamente.\n\nDependencia: " + value);
            } else {
                showAlert("No se pudo guardar", "No se pudo guardar la dependencia. Revisa la conexi\u00f3n o si ya existe en la base de datos.");
            }
        });
    }

    private void showEditDepartmentDialog(TableView<Map<String, String>> table, VBox details, String currentName) {
        if (appFrame == null || currentName == null) return;

        Map<String, String> deptData = departmentDAO.getDepartmentData(currentName);

        VBox card = new VBox(14);
        card.getStyleClass().add("modal-card-large");

        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/icon_dependencias_unique.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box");
        VBox headerTexts = new VBox(3);
        Label title = new Label("Editar dependencia");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("Actualiza toda la informaci\u00f3n de la dependencia en el cat\u00e1logo institucional.");
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

        TextField dependencyName = UIUtils.decoratedTextField("Nombre de la dependencia");
        dependencyName.setText(deptData.getOrDefault("dependencia", currentName));

        List<Employee> employees = employeeDAO.list("").stream()
                .filter(s -> s.getFullName() != null && !s.getFullName().isBlank())
                .sorted(Comparator.comparing(s -> s.getFullName().toLowerCase()))
                .collect(Collectors.toList());
        Map<String, Employee> employeeByName = new LinkedHashMap<>();
        List<String> names = new ArrayList<>();
        for (Employee emp : employees) {
            String n = UIUtils.upperUi(emp.getFullName());
            String key = UIUtils.normalizeLookup(n);
            if (!employeeByName.containsKey(key)) {
                employeeByName.put(key, emp);
                names.add(n);
            }
        }

        ComboBox<String> managerName = UIUtils.editableCombo(names, "Responsable institucional");
        String savedResponsable = deptData.getOrDefault("responsable", "");
        if (savedResponsable != null && !savedResponsable.isBlank()) {
            UIUtils.setComboValue(managerName, savedResponsable);
        }

        ComboBox<String> managerJob = UIUtils.editableCombo(departmentDAO.listJobTitleNames(), "Cargo directivo");
        String savedCargo = deptData.getOrDefault("cargo_directivo", "");
        if (savedCargo != null && !savedCargo.isBlank()) {
            UIUtils.setComboValue(managerJob, savedCargo);
        }

        TextField managerEmail = UIUtils.decoratedTextField("Correo (opcional)");
        managerEmail.setText(deptData.getOrDefault("correo_responsable", ""));

        TextField managerExt = UIUtils.decoratedTextField("Extensi\u00f3n telef\u00f3nica (opcional)");
        managerExt.setText(deptData.getOrDefault("extension_telefonica", ""));

        TextArea funciones = new TextArea();
        funciones.setPromptText("Funciones resumidas de la dependencia...");
        funciones.getStyleClass().add("form-text-area");
        funciones.setPrefRowCount(3);
        funciones.setText(deptData.getOrDefault("funciones", ""));

        managerName.setOnAction(ev -> {
            String sel = UIUtils.comboText(managerName);
            Employee e = employeeByName.get(UIUtils.normalizeLookup(sel));
            if (e != null) {
                if (e.getEmail() != null && !e.getEmail().isBlank()) managerEmail.setText(e.getEmail());
                if (e.getPhone() != null && !e.getPhone().isBlank()) managerExt.setText(e.getPhone());
                UIUtils.setComboValue(managerJob, e.getCurrentJobTitle());
            }
        });

        form.add(UIUtils.formField("Dependencia", dependencyName), 0, 0);
        form.add(UIUtils.formField("Responsable", managerName), 1, 0);
        form.add(UIUtils.formField("Cargo directivo", managerJob), 0, 1);
        form.add(UIUtils.formField("Correo responsable", managerEmail), 1, 1);
        form.add(UIUtils.formField("Extensi\u00f3n", managerExt), 0, 2);
        form.add(UIUtils.formField("Funciones", funciones), 0, 3, 2, 1);

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
            String value = dependencyName.getText() == null ? "" : dependencyName.getText().trim();
            if (value.isBlank()) { showAlert("Formulario incompleto", "Ingresa el nombre de la dependencia."); return; }

            String responsable = UIUtils.comboText(managerName);
            String cargo = UIUtils.comboText(managerJob);
            String correo = managerEmail.getText() == null ? "" : managerEmail.getText().trim();
            String extension = managerExt.getText() == null ? "" : managerExt.getText().trim();
            String funciones_text = funciones.getText() == null ? "" : funciones.getText().trim();

            if (departmentDAO.updateFull(currentName, value, responsable, cargo, correo, extension, funciones_text)) {
                closeOverlay(overlay);
                if (table != null) table.setItems(FXCollections.observableArrayList(departmentsData("")));
                selectDepartmentByName(table, details, value);
                showAlert("Dependencia actualizada", "La dependencia fue actualizada correctamente.");
            } else {
                showAlert("No se pudo actualizar", "No se pudo actualizar la dependencia. Verifica que no exista otra con el mismo nombre o la conexi\u00f3n a la base.");
            }
        });
    }

    private void showDeleteDepartmentDialog(String name, TableView<Map<String, String>> table, VBox details) {
        if (appFrame == null || name == null) return;
        VBox card = new VBox(12);
        card.getStyleClass().add("modal-card");
        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        StackPane iconBox = new StackPane(UIUtils.image("/assets/status_denied.png", 28, 28, true));
        iconBox.getStyleClass().add("modal-icon-box-danger");
        VBox texts = new VBox(3);
        Label title = new Label("Eliminar dependencia");
        title.getStyleClass().add("modal-title");
        Label subtitle = new Label("\u00bfEst\u00e1s seguro de eliminar la dependencia \"" + name + "\"? Si tiene servidores asociados no podr\u00e1 eliminarse.");
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
            if (departmentDAO.delete(name)) {
                closeOverlay(overlay);
                if (table != null) table.setItems(FXCollections.observableArrayList(departmentsData("")));
                if (details != null) details.getChildren().setAll(UIUtils.emptyManagerCard());
                showAlert("Dependencia eliminada", "La dependencia fue eliminada correctamente.");
            } else {
                showAlert("No se pudo eliminar", "No se pudo eliminar la dependencia. Es probable que tenga servidores asociados o exista un problema con la base de datos.");
            }
        });
    }

    private List<Map<String, String>> departmentsData(String filter) {
        List<Map<String, String>> rows = departmentDAO.list(filter);
        if (rows == null) {
            return new ArrayList<>();
        }
        return rows;
    }

    private TableView<Map<String, String>> createManagersTable(List<Map<String, String>> rows) {
        TableView<Map<String, String>> table = new TableView<>(FXCollections.observableArrayList(rows));
        table.getStyleClass().add("profile-search-table");
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        UIUtils.addMapColumn(table, "Dependencia", "Dependencia", 310);
        UIUtils.addMapColumn(table, "Cargo directivo", "Cargo", 260);
        UIUtils.addMapColumn(table, "Nombre", "Nombre", 240);
        UIUtils.addMapColumn(table, "Correo", "Correo", 240);
        UIUtils.addMapColumn(table, "Ext.", "Extension", 85);
        TableColumn<Map<String, String>, String> acciones = new TableColumn<>("Acciones");
        acciones.setCellValueFactory(cell -> new SimpleStringProperty(""));
        acciones.setCellFactory(tc -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getIndex() < 0 || getIndex() >= getTableView().getItems().size()) {
                    setGraphic(null);
                    return;
                }
                Map<String, String> row = getTableView().getItems().get(getIndex());
                HBox box = new HBox(8);
                box.setAlignment(Pos.CENTER);
                Button view = UIUtils.actionIconButton("/assets/icon_view.png", "Ver dependencia");
                view.setOnAction(e -> {
                    getTableView().getSelectionModel().select(row);
                });
                Button edit = UIUtils.actionIconButton("/assets/icon_file.png", "Editar dependencia");
                edit.setOnAction(e -> showEditDepartmentDialog(getTableView(), null, row.getOrDefault("Dependencia", "")));
                Button del = UIUtils.actionIconButton("/assets/status_denied.png", "Eliminar dependencia");
                del.setOnAction(e -> showDeleteDepartmentDialog(row.getOrDefault("Dependencia", ""), getTableView(), null));
                box.getChildren().addAll(view, edit, del);
                setGraphic(box);
                setText(null);
            }
        });
        acciones.setPrefWidth(160);
        table.getColumns().add(acciones);
        return table;
    }

    private Node buildManagerProfile(Map<String, String> selected) {
        VBox box = new VBox(16);
        HBox header = new HBox(22);
        header.getStyleClass().add("profile-hero");
        header.setAlignment(Pos.CENTER_LEFT);
        ImageView avatar = UIUtils.image("/assets/default_avatar.png", 96, 96, true);
        VBox person = new VBox(7);
        Label name = new Label(selected.getOrDefault("Nombre", "No registrado"));
        name.getStyleClass().add("profile-name");
        Label jobTitle = new Label(selected.getOrDefault("Cargo", "No registrado"));
        jobTitle.getStyleClass().add("profile-sub");
        Label dep = new Label(selected.getOrDefault("Dependencia", "No registrada"));
        dep.getStyleClass().add("profile-sub");
        person.getChildren().addAll(name, jobTitle, dep);
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        VBox meta = new VBox(12,
                metaRow("/assets/icon_contact_unique.png", "Correo", selected.getOrDefault("Correo", "No registrado")),
                metaRow("/assets/icon_calendar_unique.png", "Extensi\u00f3n", selected.getOrDefault("Extension", "No registrada"))
        );
        meta.setAlignment(Pos.CENTER_RIGHT);
        header.getChildren().addAll(avatar, person, spacer, meta);

        HBox cards = new HBox(16);
        VBox institutionalCard = infoCard("/assets/icon_dependencias_unique.png", "Datos de la dependencia",
                UIUtils.row("Dependencia", selected.getOrDefault("Dependencia", "")),
                UIUtils.row("Ciudad", selected.getOrDefault("Ciudad", "")),
                UIUtils.row("Estado", selected.getOrDefault("Estado", ""))
        );
        VBox managerCard = infoCard("/assets/icon_profile_unique.png", "Perfil del cargo",
                UIUtils.row("Cargo", selected.getOrDefault("Cargo", "")),
                UIUtils.row("Nombre", selected.getOrDefault("Nombre", "")),
                UIUtils.row("Correo", selected.getOrDefault("Correo", ""))
        );
        VBox functionsCard = infoCard("/assets/icon_history_unique.png", "Funciones resumidas",
                UIUtils.row("Rol principal", selected.getOrDefault("Funciones", "")),
                UIUtils.row("Permisos", authDAO.canEditRequests() ? "Edici\u00f3n habilitada seg\u00fan rol" : "Consulta y descarga"),
                UIUtils.row("Fuente", "Estructura institucional")
        );
        for (VBox c : List.of(institutionalCard, managerCard, functionsCard)) HBox.setHgrow(c, Priority.ALWAYS);
        cards.getChildren().addAll(institutionalCard, managerCard, functionsCard);
        box.getChildren().addAll(header, cards);
        return box;
    }

    private void selectDepartmentByName(TableView<Map<String, String>> table, VBox details, String name) {
        if (table == null || table.getItems().isEmpty()) {
            if (details != null) details.getChildren().setAll(UIUtils.emptyManagerCard());
            return;
        }
        String key = UIUtils.normalizeLookup(name);
        for (Map<String, String> row : table.getItems()) {
            if (UIUtils.normalizeLookup(row.getOrDefault("Dependencia", "")).equals(key)) {
                table.getSelectionModel().select(row);
                if (details != null) details.getChildren().setAll(buildManagerProfile(row));
                return;
            }
        }
        table.getSelectionModel().select(0);
        if (details != null && !table.getItems().isEmpty()) details.getChildren().setAll(buildManagerProfile(table.getItems().get(0)));
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
