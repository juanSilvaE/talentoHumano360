package com.talento360.utils;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import com.talento360.models.AdministrativeRequest;
import com.talento360.models.Employee;

import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Control;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.Separator;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.util.StringConverter;

public final class UIUtils {

    private static final DateTimeFormatter UI_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private UIUtils() {}

    public static ImageView image(String path, double width, double height, boolean preserve) {
        ImageView view = new ImageView();
        try (InputStream stream = UIUtils.class.getResourceAsStream(path)) {
            if (stream != null) {
                Image img = new Image(stream);
                view.setImage(img);
            }
        } catch (Exception ignored) {}
        view.setFitWidth(width);
        view.setFitHeight(height);
        view.setPreserveRatio(preserve);
        return view;
    }

    public static String format(int n) {
        return String.format("%,d", n).replace(',', '.');
    }

    public static String upperUi(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toUpperCase(new Locale("es", "CO"));
    }

    public static String lowerUi(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase(new Locale("es", "CO"));
    }

    public static String value(Employee s, Function<Employee, String> getter) {
        if (s == null) return "No registrado";
        String v = getter.apply(s);
        return v == null || v.isBlank() ? "No registrado" : v;
    }

    public static String formatUiDate(LocalDate date) {
        return date == null ? "" : date.format(UI_DATE);
    }

    public static LocalDate parseUiDate(String value) {
        if (value == null || value.isBlank()) return null;
        String clean = value.trim();
        for (DateTimeFormatter formatter : List.of(
                UI_DATE,
                DateTimeFormatter.ofPattern("d/M/yyyy"),
                DateTimeFormatter.ISO_LOCAL_DATE
        )) {
            try {
                return LocalDate.parse(clean, formatter);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    public static List<Map<String, String>> pageSlice(List<Map<String, String>> rows, int page, int pageSize) {
        if (rows == null || rows.isEmpty()) return List.of();
        int safePage = Math.max(1, page);
        int from = Math.min((safePage - 1) * pageSize, rows.size());
        int to = Math.min(from + pageSize, rows.size());
        return new ArrayList<>(rows.subList(from, to));
    }

    public static Button pageBtn(String text, boolean active) {
        Button btn = new Button(text);
        btn.getStyleClass().add(active ? "page-btn" : "page-btn-inactive");
        return btn;
    }

    public static void updatePageButtons(List<Button> buttons, int activePage) {
        for (int i = 0; i < buttons.size(); i++) {
            Button btn = buttons.get(i);
            btn.getStyleClass().removeAll("page-btn", "page-btn-inactive");
            btn.getStyleClass().add(i + 1 == activePage ? "page-btn" : "page-btn-inactive");
        }
    }

    public static String procesoIcon(String proceso) {
        return switch (proceso) {
            case "Hoja de vida" -> "\uD83D\uDCC4";
            case "Permiso" -> "\uD83D\uDCCB";
            case "Vacaciones" -> "\uD83C\uDFD6";
            case "Incapacidad" -> "\uD83C\uDFE5";
            case "Licencia maternidad" -> "\uD83D\uDC69";
            default -> "\uD83D\uDCC1";
        };
    }

    public static String procesoTagClass(String proceso) {
        return switch (proceso) {
            case "Hoja de vida" -> "tag-hoja";
            case "Permiso" -> "tag-permiso";
            case "Vacaciones" -> "tag-vacaciones";
            case "Licencia maternidad" -> "tag-maternidad";
            default -> "tag-incapacidad";
        };
    }

    public static String dashboardBadgeClass(String status) {
        if (status == null) return "badge-pendiente";
        String e = status.trim().toLowerCase();
        if (e.contains("aprob") || e.contains("complet")) return "badge-completado";
        if (e.contains("final")) return "badge-finalizada";
        if (e.contains("rechaz")) return "badge-rechazada";
        if (e.contains("revisión") || e.contains("revision")) return "badge-revision";
        return "badge-pendiente";
    }

    public static String employeeStatusBadgeClass(String status) {
        if (status == null) return "badge-pendiente";
        String e = status.toLowerCase();
        if (e.contains("retir") || e.contains("inactivo")) return "badge-rechazada";
        if (e.contains("encargo") || e.contains("provisional")) return "badge-revision";
        return "badge-aprobada";
    }

    public static String profileStatusClass(String status) {
        if (status == null) return "status-approved";
        String e = status.toLowerCase();
        if (e.contains("retir") || e.contains("inactivo")) return "status-rejected";
        if (e.contains("encargo") || e.contains("provisional")) return "status-review";
        return "status-approved";
    }

    public static String historyBadgeClass(String type) {
        String t = type == null ? "" : type.toLowerCase();
        if (t.contains("actualización") || t.contains("actualizacion") || t.contains("permiso")) return "tag-permiso";
        if (t.contains("dependencia") || t.contains("vacaciones")) return "tag-vacaciones";
        if (t.contains("document")) return "tag-incapacidad";
        return "tag-hoja";
    }

    public static boolean containsSearch(String value, String filter) {
        return value != null && value.toLowerCase().contains(filter);
    }

    public static boolean matchesComboFilter(String value, String selected, String allValue) {
        if (selected == null || selected.isBlank() || normalizeLookup(selected).equals(normalizeLookup(allValue))) return true;
        return value != null && normalizeLookup(value).contains(normalizeLookup(selected));
    }

    public static boolean matchesDateRange(AdministrativeRequest v, LocalDate start, LocalDate end) {
        if (start == null && end == null) return true;
        LocalDate date = parseUiDate(v == null ? null : v.getStartDate());
        if (date == null) return false;
        if (start != null && date.isBefore(start)) return false;
        return end == null || !date.isAfter(end);
    }

    public static List<AdministrativeRequest> pageSliceRequests(List<AdministrativeRequest> rows, int page, int pageSize) {
        if (rows == null || rows.isEmpty()) return List.of();
        int safePage = Math.max(1, page);
        int from = Math.min((safePage - 1) * pageSize, rows.size());
        int to = Math.min(from + pageSize, rows.size());
        return new ArrayList<>(rows.subList(from, to));
    }

    public static boolean isFemaleRequest(AdministrativeRequest v) {
        String person = v == null || v.getPerson() == null ? "" : v.getPerson().toLowerCase();
        String noteText = v == null || v.getNotes() == null ? "" : v.getNotes().toLowerCase();
        String combined = person + " " + noteText;
        if (combined.contains(" genero: f") || combined.contains(" género: f") || combined.contains("mujer") || combined.contains("femenino")) return true;
        String[] maleNames = {" carlos", " juan", " miguel", " andrés", "andres", " felipe", " jorge", " santiago", " daniel", " camilo", " sebastián", "sebastian", "eduardo", "pablo"};
        for (String male : maleNames) {
            if ((" " + person + " ").contains(male + " ")) return false;
        }
        String[] femaleNames = {" laura", " diana", " paula", " natalia", " maría", " maria", " valentina", " mónica", " monica", " claudia", " carolina", " isabella", " lucía", " lucia", " camila", " fernanda", " alejandra", " verónica", " veronica", " dahiana", " ana", " sofía", " sofia"};
        for (String female : femaleNames) {
            if ((" " + person + " ").contains(female + " ")) return true;
        }
        return false;
    }

    public static String iconForType(String type) {
        return switch (type) {
            case "Incapacidad" -> "/assets/icon_incapacity_unique_two.png";
            case "Permiso" -> "/assets/icon_file_unique.png";
            case "Licencia maternidad" -> "/assets/icon_maternity_unique.png";
            default -> "/assets/icon_vacations_unique.png";
        };
    }

    public static void setTabStyles(Button active, Button... inactiveButtons) {
        active.getStyleClass().removeAll("tab", "tab-active");
        active.getStyleClass().add("tab-active");
        for (Button inactive : inactiveButtons) {
            inactive.getStyleClass().removeAll("tab", "tab-active");
            inactive.getStyleClass().add("tab");
        }
    }

    public static String requestStatusAsset(String status) {
        return switch (normalizeRequestStatus(status)) {
            case "Aprobada" -> "/assets/status_approved.png";
            case "Finalizada" -> "/assets/status_finalized.png";
            case "Rechazada" -> "/assets/status_denied.png";
            case "En revisión" -> "/assets/status_revision.png";
            default -> "/assets/status_pending.png";
        };
    }

    public static String requestBadgeClass(String status) {
        return switch (normalizeRequestStatus(status)) {
            case "Aprobada" -> "badge-aprobada";
            case "Finalizada" -> "badge-finalizada";
            case "Rechazada" -> "badge-rechazada";
            case "En revisión" -> "badge-revision";
            default -> "badge-pendiente";
        };
    }

    public static TextField filterField(String prompt) {
        TextField field = new TextField();
        field.setPromptText(prompt);
        field.getStyleClass().add("input");
        field.setPrefWidth(155);
        return field;
    }

    public static TextField decoratedTextField(String prompt) {
        TextField field = new TextField();
        field.setPromptText(prompt);
        field.getStyleClass().add("form-input");
        field.setMaxWidth(Double.MAX_VALUE);
        return field;
    }

    public static ComboBox<String> editableCombo(List<String> values, String prompt) {
        Set<String> seen = new HashSet<>();
        List<String> cleanValues = values == null ? List.of() : values.stream()
                                                                    .filter(v -> v != null && !v.isBlank())
                                                                    .map(UIUtils::upperUi)
                                                                    .filter(v -> seen.add(normalizeLookup(v)))
                                                                    .sorted()
                                                                    .collect(Collectors.toList());
        ComboBox<String> combo = new ComboBox<>(FXCollections.observableArrayList(cleanValues));
        combo.setEditable(false);
        combo.setPromptText(prompt);
        combo.getStyleClass().add("combo");
        combo.setMaxWidth(Double.MAX_VALUE);
        return combo;
    }

    public static List<String> withDefault(String defaultValue, List<String> values) {
        List<String> result = new ArrayList<>();
        result.add(defaultValue);
        if (values != null) {
            values.stream()
                    .filter(v -> v != null && !v.isBlank())
                    .filter(v -> !normalizeLookup(v).equals(normalizeLookup(defaultValue)))
                    .forEach(result::add);
        }
        return result;
    }

    public static String comboText(ComboBox<String> combo) {
        if (combo == null) return "";
        String editorText = combo.isEditable() && combo.getEditor() != null ? combo.getEditor().getText() : null;
        String value = editorText != null && !editorText.isBlank() ? editorText : combo.getValue();
        return value == null ? "" : value.trim();
    }

    public static void setComboValue(ComboBox<String> combo, String value) {
        if (combo == null || value == null || value.isBlank()) return;
        String clean = upperUi(value);
        if (!combo.getItems().contains(clean)) combo.getItems().add(clean);
        combo.setValue(clean);
        if (combo.isEditable() && combo.getEditor() != null) combo.getEditor().setText(clean);
    }

    public static String normalizeLookup(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    public static String defaultDaysForType(String type) {
        return switch (type == null ? "" : type) {
            case "Incapacidad" -> "3";
            case "Permiso" -> "1";
            case "Licencia maternidad" -> "126";
            default -> "15";
        };
    }

    public static int parsePositiveDays(String value) {
        try {
            int days = Integer.parseInt(value == null ? "" : value.trim());
            return days > 0 ? days : -1;
        } catch (Exception e) {
            return -1;
        }
    }

    public static VBox formField(String label, Control control) {
        VBox box = new VBox(6);
        Label l = new Label(label);
        l.getStyleClass().add("field-label");
        control.setMaxWidth(Double.MAX_VALUE);
        box.getChildren().addAll(l, control);
        return box;
    }

    public static <T> void addColumn(TableView<T> table, String title, Function<T, String> getter, int width) {
        TableColumn<T, String> column = new TableColumn<>(title);
        column.setCellValueFactory(cell -> new SimpleStringProperty(getter.apply(cell.getValue())));
        column.setPrefWidth(width);
        table.getColumns().add(column);
    }

    public static TextField readonlyField(String value) {
        TextField field = decoratedTextField("");
        field.setText(value == null ? "" : value);
        field.setEditable(false);
        field.getStyleClass().add("readonly-field");
        return field;
    }

    public static String filingNumber(AdministrativeRequest v) {
        String type = recordType(v);
        String prefix = switch (type) {
            case "Incapacidad" -> "INCA";
            case "Permiso" -> "PER";
            case "Licencia maternidad" -> "MAT";
            default -> "VAC";
        };
        int id = v.getRequestId() == 0 ? 999 : v.getRequestId();
        return prefix + "-2026-" + String.format("%05d", Math.abs(id));
    }

    public static String recordType(AdministrativeRequest v) {
        String noteText = v.getNotes() == null ? "" : v.getNotes().toLowerCase();
        String employmentText = v.getRequestType() == null ? "" : v.getRequestType().toLowerCase();
        if (employmentText.contains("matern")) return "Licencia maternidad";
        if (employmentText.contains("permiso")) return "Permiso";
        if (employmentText.contains("incap")) return "Incapacidad";
        if (employmentText.contains("vacacion") || employmentText.contains("vacaciones")) return "Vacaciones";
        if (noteText.contains("matern")) return "Licencia maternidad";
        if (noteText.contains("permiso")) return "Permiso";
        if (noteText.contains("incap")) return "Incapacidad";
        if (noteText.contains("vacacion") || noteText.contains("vacaciones")) return "Vacaciones";
        int mod = Math.abs(v.getRequestId()) % 6;
        return switch (mod) {
            case 0 -> "Incapacidad";
            case 1 -> "Permiso";
            case 2 -> "Licencia maternidad";
            default -> "Vacaciones";
        };
    }

    public static String normalizeRequestStatus(String status) {
        if (status == null || status.isBlank()) return "Pendiente";
        String value = status.trim().toLowerCase();
        if (value.contains("aprob")) return "Aprobada";
        if (value.contains("final")) return "Finalizada";
        if (value.contains("rechaz")) return "Rechazada";
        if (value.contains("revisi")) return "En revisión";
        return "Pendiente";
    }

    public static String endDate(AdministrativeRequest request) {
        if (request == null) return "Pendiente";
        LocalDate startDate = parseUiDate(request.getStartDate());
        int days = parsePositiveDays(request.getTotalDays());
        if (startDate == null || days <= 0) return endDate(request.getStartDate());
        return formatUiDate(startDate.plusDays(days - 1L));
    }

    public static String endDate(String date) {
        return date == null || date.isBlank() ? "Pendiente" : date;
    }

    public static String requestDate(AdministrativeRequest v) {
        if (v != null && v.getRequestDate() != null && !v.getRequestDate().isBlank()) {
            LocalDate requestDate = parseUiDate(v.getRequestDate());
            return requestDate == null ? v.getRequestDate() : formatUiDate(requestDate);
        }
        int day = 1 + Math.abs(v.getRequestId()) % 28;
        int month = 1 + Math.abs(v.getRequestId()) % 6;
        return String.format("%02d/%02d/2025", day, month);
    }

    public static Label sectionLabel(String title) {
        Label label = new Label(title);
        label.getStyleClass().add("info-title");
        return label;
    }

    public static HBox row(String label, String value) {
        HBox r = new HBox(8);
        r.getStyleClass().add("info-row");
        Label l = new Label(label);
        l.getStyleClass().add("info-label");
        String shownValue = value == null || value.isBlank() ? "NO REGISTRADO" : value;
        if (!shownValue.contains("@")) shownValue = upperUi(shownValue);
        Label v = new Label(shownValue);
        v.getStyleClass().add("info-value");
        v.setWrapText(true);
        v.setMaxWidth(200);
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        r.getChildren().addAll(l, spacer, v);
        return r;
    }

    public static TableView<Map<String, String>> createHistoryTable(List<Map<String, String>> rows) {
        TableView<Map<String, String>> table = new TableView<>();
        table.setItems(FXCollections.observableArrayList(rows));
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        List<String> keys = List.of("Realizado por", "Descripción", "Tipo de evento", "Fecha");
        for (String key : keys) {
            TableColumn<Map<String, String>, String> col = new TableColumn<>(key);
            col.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().getOrDefault(key, "")));

            if (key.equals("Tipo de evento")) {
                col.setCellFactory(tc -> new TableCell<>() {
                    @Override
                    protected void updateItem(String item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty || item == null) { setGraphic(null); setText(null); return; }
                        Label badge = new Label(item.toUpperCase());
                        badge.getStyleClass().add(historyBadgeClass(item));
                        setGraphic(badge);
                        setText(null);
                    }
                });
            }

            col.setPrefWidth(switch (key) {
                case "Descripción" -> 330;
                case "Tipo de evento" -> 185;
                case "Realizado por" -> 220;
                default -> 170;
            });
            table.getColumns().add(col);
        }
        return table;
    }

    public static List<Map<String, String>> recentHistoryFor(Employee selected) {
        if (selected == null) return List.of();
        String employmentStatus = value(selected, Employee::getEmploymentStatus);
        if (employmentStatus.toLowerCase().contains("retir") || employmentStatus.toLowerCase().contains("inactivo")) {
            return List.of();
        }

        String name = value(selected, Employee::getFullName).toUpperCase();
        int seed = Math.abs((value(selected, Employee::getRecordId) + name).hashCode());
        String[] types = {"ACTUALIZACIÓN DE DATOS", "DOCUMENTACIÓN", "VACACIONES", "ESTADO LABORAL", "CAMBIO DE DEPENDENCIA", "PERMISO"};
        String[] descs = {
                "ACTUALIZACIÓN DE INFORMACIÓN DE CONTACTO",
                "CARGA DE CERTIFICADO DE ESTUDIOS",
                "SOLICITUD DE VACACIONES APROBADA",
                "REVISIÓN DE SITUACIÓN ADMINISTRATIVA",
                "CAMBIO DE DEPENDENCIA REGISTRADO",
                "PERMISO ADMINISTRATIVO REGISTRADO"
        };
        String[] autores = {name, "TALENTO 360 HUMANO", "DIRECCIÓN DE TALENTO HUMANO"};
        List<Map<String, String>> rows = new ArrayList<>();
        int count = 4 + (seed % 3);
        for (int i = 0; i < count; i++) {
            int idx = (seed + i * 2) % types.length;
            rows.add(Map.of(
                    "Realizado por", autores[(seed + i) % autores.length],
                    "Descripción", descs[idx],
                    "Tipo de evento", types[idx],
                    "Fecha", String.format("%02d/%02d/2026  %02d:%02d %s",
                            1 + ((seed + i * 7) % 27),
                            1 + ((seed / 3 + i) % 5),
                            8 + ((seed + i) % 9),
                            (seed + i * 13) % 60,
                            i % 2 == 0 ? "A.M." : "P.M.")
            ));
        }
        return rows;
    }

    public static Node emptyProfileCard() {
        VBox box = new VBox(10);
        box.getStyleClass().add("info-card-wide");
        Label icon = new Label("\uD83D\uDC64");
        icon.setStyle("-fx-font-size: 36px;");
        Label t = new Label("Selecciona un servidor para ver el resumen");
        t.getStyleClass().add("section-title");
        Label msg = new Label("Busca por nombre, cédula, dependencia o cargo para actualizar los paneles del perfil.");
        msg.getStyleClass().add("muted");
        box.setAlignment(Pos.CENTER);
        box.getChildren().addAll(icon, t, msg);
        return box;
    }

    public static Node emptyManagerCard() {
        VBox box = new VBox(10);
        box.getStyleClass().add("info-card-wide");
        box.setAlignment(Pos.CENTER);
        Label icon = new Label("\uD83C\uDFDB");
        icon.setStyle("-fx-font-size: 36px;");
        Label msg = new Label("No se encontraron dependencias con ese criterio.");
        msg.getStyleClass().add("section-title");
        box.getChildren().addAll(icon, msg);
        return box;
    }

    public static void addMapColumn(TableView<Map<String, String>> table, String title, String key, int width) {
        TableColumn<Map<String, String>, String> col = new TableColumn<>(title);
        col.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().getOrDefault(key, "")));
        col.setPrefWidth(width);
        table.getColumns().add(col);
    }

    public static String statusAssetPath(String status) {
        if (status == null) return "/assets/status_default.png";

        String s = status.toLowerCase();

        if (s.contains("activo")) {
            return "/assets/status_activo.png";
        }

        if (s.contains("encargo")) {
            return "/assets/status_encargo.png";
        }

        if (s.contains("retirado") || s.contains("inactivo")) {
            return "/assets/status_retirado.png";
        }

        if (s.contains("provisional")) {
            return "/assets/status_provisional.png";
        }

        return "/assets/status_default.png";
    }

    public static void selectEmployeeByDocument(TableView<Employee> table, VBox details, String document) {
        if (table == null || table.getItems().isEmpty()) {
            if (details != null) details.getChildren().setAll(emptyProfileCard());
            return;
        }
        for (Employee item : table.getItems()) {
            if (item.getDocumentId() != null && item.getDocumentId().equals(document)) {
                table.getSelectionModel().select(item);
                if (details != null) details.getChildren().setAll(buildProfileContent(item));
                return;
            }
        }
        table.getSelectionModel().select(0);
        if (details != null && !table.getItems().isEmpty()) details.getChildren().setAll(buildProfileContent(table.getItems().get(0)));
    }

    public static Node buildProfileContent(Employee selected) {
        VBox box = new VBox(16);
        box.setMaxWidth(Double.MAX_VALUE);
        HBox cards = new HBox(16);
        cards.setMaxWidth(Double.MAX_VALUE);
        VBox personalInfo = infoCard("/assets/icon_profile_unique.png", "Información personal",
                row("Documento de identidad", value(selected, Employee::getDocumentId)),
                row("Fecha de nacimiento", "No registrada"),
                row("Lugar de nacimiento", "Tunja, Boyacá"),
                row("Género", value(selected, Employee::getGender)),
                row("Estado civil", "No registrado")
        );
        VBox workInfo = infoCard("/assets/icon_labor_unique.png", "Información laboral",
                row("Dependencia", value(selected, Employee::getDepartment)),
                row("Cargo", value(selected, Employee::getCurrentJobTitle)),
                row("Cargo base", value(selected, Employee::getBaseJobTitle)),
                row("Fecha de ingreso", value(selected, Employee::getStartDate)),
                row("Tipo de vinculación", value(selected, Employee::getEmploymentStatus))
        );
        VBox contactInfo = infoCard("/assets/icon_contact_unique.png", "Información de contacto",
                row("Correo", value(selected, Employee::getEmail)),
                row("Correo personal", "No registrado"),
                row("Teléfono celular", value(selected, Employee::getPhone)),
                row("Teléfono fijo", "No registrado"),
                row("Ciudad", "Tunja, Boyacá")
        );
        for (VBox c : List.of(personalInfo, workInfo, contactInfo)) HBox.setHgrow(c, Priority.ALWAYS);
        cards.getChildren().addAll(personalInfo, workInfo, contactInfo);
        box.getChildren().addAll(profileHeader(selected), cards);
        return box;
    }

    public static VBox profileHeader(Employee s) {
        HBox header = new HBox(22);
        header.getStyleClass().add("profile-hero");
        header.setAlignment(Pos.CENTER_LEFT);

        StackPane avatarStack = new StackPane();
        ImageView avatar = image("/assets/default_avatar.png", 100, 100, true);
        avatarStack.getChildren().add(avatar);

        VBox person = new VBox(7);
        Label name = new Label(value(s, Employee::getFullName));
        name.getStyleClass().add("profile-name");
        Label jobTitle = new Label(value(s, Employee::getCurrentJobTitle));
        jobTitle.getStyleClass().add("profile-sub");

        HBox depRow = new HBox(6);
        depRow.setAlignment(Pos.CENTER_LEFT);
        ImageView buildingIcon = image("/assets/icon_dependencias_unique.png", 15, 15, true);
        Label dep = new Label(value(s, Employee::getDepartment));
        dep.getStyleClass().add("profile-sub");
        depRow.getChildren().addAll(buildingIcon, dep);

        Label active = statusBadge(value(s, Employee::getEmploymentStatus).toUpperCase(), profileStatusClass(value(s, Employee::getEmploymentStatus)));
        person.getChildren().addAll(name, jobTitle, depRow, active);

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        VBox meta = new VBox(14);
        meta.setAlignment(Pos.CENTER_RIGHT);
        meta.getChildren().addAll(
                metaRow("/assets/icon_calendar_unique.png", "Fecha de ingreso", value(s, Employee::getStartDate)),
                metaRow("/assets/icon_link_unique.png", "Tipo de vinculación", value(s, Employee::getEmploymentStatus))
        );
        header.getChildren().addAll(avatarStack, person, spacer, meta);
        return new VBox(header);
    }

    public static Label statusBadge(String text, String styleClass) {
        String cleanText = text == null || text.isBlank() ? "NO REGISTRADO" : text.toUpperCase();

        Label badge = new Label(cleanText);
        badge.getStyleClass().add(styleClass);

        ImageView statusIcon = image(statusAssetPath(cleanText), 14, 14, true);

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

    public static HBox metaRow(String iconPath, String label, String val) {
        ImageView icon = image(iconPath, 25, 25, true);
        VBox texts = new VBox(3);
        Label l = new Label(label);
        l.getStyleClass().add("meta-label");
        Label v = new Label(val);
        v.getStyleClass().add("meta-value");
        texts.getChildren().addAll(l, v);
        return new HBox(10, icon, texts);
    }

    public static VBox infoCard(String iconPath, String title, HBox... rows) {
        VBox card = new VBox(10);
        card.getStyleClass().add("info-card");
        card.setMaxWidth(Double.MAX_VALUE);
        HBox heading = new HBox(8);
        heading.setAlignment(Pos.CENTER_LEFT);
        heading.getChildren().addAll(image(iconPath, 22, 22, true), sectionLabel(title));
        Separator sep = new Separator();
        sep.getStyleClass().add("gold-separator");
        sep.setPadding(new Insets(2, 0, 4, 0));
        card.getChildren().add(heading);
        card.getChildren().add(sep);
        card.getChildren().addAll(rows);
        return card;
    }

    public static void selectDepartmentByName(TableView<Map<String, String>> table, VBox details, String name) {
        if (table == null || table.getItems().isEmpty()) {
            if (details != null) details.getChildren().setAll(emptyManagerCard());
            return;
        }
        String key = normalizeLookup(name);
        for (Map<String, String> row : table.getItems()) {
            if (normalizeLookup(row.getOrDefault("Dependencia", "")).equals(key)) {
                table.getSelectionModel().select(row);
                if (details != null) details.getChildren().setAll(buildManagerProfile(row));
                return;
            }
        }
        table.getSelectionModel().select(0);
        if (details != null && !table.getItems().isEmpty()) details.getChildren().setAll(buildManagerProfile(table.getItems().get(0)));
    }

    private static Node buildManagerProfile(Map<String, String> selected) {
        VBox box = new VBox(16);
        HBox header = new HBox(22);
        header.getStyleClass().add("profile-hero");
        header.setAlignment(Pos.CENTER_LEFT);
        ImageView avatar = image("/assets/default_avatar.png", 96, 96, true);
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
                metaRow("/assets/icon_calendar_unique.png", "Extensión", selected.getOrDefault("Extension", "No registrada"))
        );
        meta.setAlignment(Pos.CENTER_RIGHT);
        header.getChildren().addAll(avatar, person, spacer, meta);

        HBox cards = new HBox(16);
        VBox institutionalCard = infoCard("/assets/icon_dependencias_unique.png", "Datos de la dependencia",
                row("Dependencia", selected.getOrDefault("Dependencia", "")),
                row("Ciudad", selected.getOrDefault("Ciudad", "")),
                row("Estado", selected.getOrDefault("Estado", ""))
        );
        VBox managerCard = infoCard("/assets/icon_profile_unique.png", "Perfil del cargo",
                row("Cargo", selected.getOrDefault("Cargo", "")),
                row("Nombre", selected.getOrDefault("Nombre", "")),
                row("Correo", selected.getOrDefault("Correo", ""))
        );
        VBox functionsCard = infoCard("/assets/icon_history_unique.png", "Funciones resumidas",
                row("Rol principal", selected.getOrDefault("Funciones", "")),
                row("Permisos", "Consulta y descarga"),
                row("Fuente", "Estructura institucional")
        );
        for (VBox c : List.of(institutionalCard, managerCard, functionsCard)) HBox.setHgrow(c, Priority.ALWAYS);
        cards.getChildren().addAll(institutionalCard, managerCard, functionsCard);
        box.getChildren().addAll(header, cards);
        return box;
    }

    public static boolean matchesRequestSearch(AdministrativeRequest v, String filter) {
        if (filter == null || filter.isBlank()) return true;

        return containsSearch(filingNumber(v), filter)
                || containsSearch(recordType(v), filter)
                || containsSearch(recordStatus(v), filter)
                || containsSearch(v.getPerson(), filter)
                || containsSearch(v.getDocument(), filter)
                || containsSearch(v.getDepartment(), filter)
                || containsSearch(v.getJobTitle(), filter)
                || containsSearch(v.getStartDate(), filter)
                || containsSearch(v.getTotalDays(), filter)
                || containsSearch(v.getNotes(), filter)
                || containsSearch(v.getRequestType(), filter);
    }

    private static String recordStatus(AdministrativeRequest v) {
        if (v != null && v.getStatus() != null && !v.getStatus().isBlank()) return normalizeRequestStatus(v.getStatus());
        int mod = Math.abs(v.getRequestId()) % 5;
        return switch (mod) {
            case 0 -> "Aprobada";
            case 1 -> "Finalizada";
            case 2 -> "Rechazada";
            case 3 -> "En revisión";
            default -> "Pendiente";
        };
    }

    public static DatePicker datePicker(String prompt) {
        DatePicker picker = new DatePicker();
        picker.setPromptText(prompt);
        picker.getStyleClass().add("input");
        picker.setPrefWidth(200);
        picker.setMinHeight(38);
        picker.setConverter(new StringConverter<>() {
            @Override
            public String toString(LocalDate date) {
                return date == null ? "" : date.format(UI_DATE);
            }

            @Override
            public LocalDate fromString(String value) {
                return parseUiDate(value);
            }
        });
        return picker;
    }

    public static ImageView vacTabIcon(String path) {
        return image(path, 22, 22, true);
    }

    public static Button actionIconButton(String asset, String tooltip) {
        Button b = new Button();
        b.getStyleClass().add("action-icon-button");
        b.setGraphic(image(asset, 16, 16, true));
        b.setTooltip(new Tooltip(tooltip));
        return b;
    }

    public static HBox fieldWithIcon(String iconChar, String prompt) {
        HBox row = new HBox(0);
        row.getStyleClass().add("input");
        row.setAlignment(Pos.CENTER_LEFT);
        Label icon = new Label(iconChar + " ");
        icon.setStyle("-fx-text-fill: #9aaabb; -fx-font-size: 14px;");
        TextField field = new TextField();
        field.setPromptText(prompt);
        field.setStyle("-fx-background-color: transparent; -fx-border-color: transparent; -fx-padding: 0; -fx-font-size: 13px;");
        HBox.setHgrow(field, Priority.ALWAYS);
        row.getChildren().addAll(icon, field);
        return row;
    }

    public static Label sidebarUnicode(String emoji) {
        Label lbl = new Label(emoji);
        lbl.setStyle("-fx-font-size: 16px;");
        return lbl;
    }

    public static void populateRequestEmployee(String name, Map<String, Employee> employeeByName, TextField document,
                                                ComboBox<String> department, ComboBox<String> jobTitle) {
        Employee employee = employeeByName.get(normalizeLookup(name));
        if (employee == null) return;
        document.setText(employee.getDocumentId() == null ? "" : employee.getDocumentId());
        setComboValue(department, employee.getDepartment());
        setComboValue(jobTitle, employee.getCurrentJobTitle());
    }

    public static void appendRow(StringBuilder sheet, int rowIndex, List<String> values) {
        sheet.append("<row r=\"").append(rowIndex).append("\">");
        for (int i = 0; i < values.size(); i++) {
            String col = excelCol(i + 1);
            sheet.append("<c r=\"").append(col).append(rowIndex).append("\" t=\"inlineStr\"><is><t>")
                    .append(xml(values.get(i))).append("</t></is></c>");
        }
        sheet.append("</row>");
    }

    public static String excelCol(int n) {
        StringBuilder sb = new StringBuilder();
        while (n > 0) {
            n--;
            sb.insert(0, (char)('A' + (n % 26)));
            n /= 26;
        }
        return sb.toString();
    }

    public static String xml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;");
    }

    public static void putZip(ZipOutputStream zip, String name, String content) throws Exception {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content.strip().getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    public static void writeSimpleXlsx(File file, List<String> headers, List<Map<String, String>> rows) throws Exception {
        try (ZipOutputStream zip = new ZipOutputStream(new FileOutputStream(file))) {
            putZip(zip, "[Content_Types].xml", """
                    <?xml version=\"1.0\" encoding=\"UTF-8\"?>
                    <Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">
                      <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>
                      <Default Extension=\"xml\" ContentType=\"application/xml\"/>
                      <Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>
                      <Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>
                    </Types>
                    """);
            putZip(zip, "_rels/.rels", """
                    <?xml version=\"1.0\" encoding=\"UTF-8\"?>
                    <Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
                      <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>
                    </Relationships>
                    """);
            putZip(zip, "xl/workbook.xml", """
                    <?xml version=\"1.0\" encoding=\"UTF-8\"?>
                    <workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">
                      <sheets><sheet name=\"Registros\" sheetId=\"1\" r:id=\"rId1\"/></sheets>
                    </workbook>
                    """);
            putZip(zip, "xl/_rels/workbook.xml.rels", """
                    <?xml version=\"1.0\" encoding=\"UTF-8\"?>
                    <Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
                      <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>
                    </Relationships>
                    """);

            StringBuilder sheet = new StringBuilder();
            sheet.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sheet.append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
            appendRow(sheet, 1, headers);
            int r = 2;
            for (Map<String, String> row : rows) {
                List<String> values = headers.stream().map(h -> row.getOrDefault(h, "")).toList();
                appendRow(sheet, r++, values);
            }
            sheet.append("</sheetData></worksheet>");
            putZip(zip, "xl/worksheets/sheet1.xml", sheet.toString());
        }
    }
}
