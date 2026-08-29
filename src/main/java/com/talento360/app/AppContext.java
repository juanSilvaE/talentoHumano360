package com.talento360.app;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.prefs.Preferences;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.talento360.controllers.DashboardController;
import com.talento360.controllers.DepartmentsController;
import com.talento360.controllers.ProfileController;
import com.talento360.controllers.RequestsController;
import com.talento360.dao.AuthDAO;
import com.talento360.dao.DashboardDAO;
import com.talento360.dao.DepartmentDAO;
import com.talento360.dao.EmployeeDAO;
import com.talento360.dao.RequestDAO;
import com.talento360.models.Employee;
import com.talento360.utils.UIUtils;

import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.ContentDisplay;
import javafx.scene.control.Control;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Separator;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.scene.control.OverrunStyle;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class AppContext {

    public static final DateTimeFormatter UI_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final Stage stage;
    private BorderPane root;
    private StackPane appFrame;
    private AppLayout layout;

    private final AuthDAO authDAO = new AuthDAO();
    private final DashboardDAO dashboardDAO = new DashboardDAO();
    private final DepartmentDAO departmentDAO = new DepartmentDAO();
    private final EmployeeDAO employeeDAO = new EmployeeDAO();
    private final RequestDAO requestDAO = new RequestDAO();

    private DashboardController dashboardController;
    private RequestsController requestsController;
    private DepartmentsController departmentsController;
    private ProfileController profileController;

    private Button btnDashboard;
    private Button profileButton;
    private Button departmentsButton;
    private Button vacationsButton;
    private Button disabilitiesButton;
    private Button permissionsButton;
    private Button maternityButton;

    private Runnable activeRequestsRefresh = () -> {};
    private Runnable activeRequestsReset = () -> {};
    private final Map<Integer, String> statusOverrides = new LinkedHashMap<>();

    public AppContext(Stage stage) {
        this.stage = stage;
        stage.setTitle("Talento 360 Humano — Gobernación de Boyacá");
        stage.setOnShown(e -> forceMaximized());
        installFullWindowGuard();
    }

    // ----- Getters -----
    public Stage getStage() { return stage; }
    public BorderPane getRoot() { return root; }
    public StackPane getAppFrame() { return appFrame; }
    public AuthDAO getAuthDAO() { return authDAO; }
    public DashboardDAO getDashboardDAO() { return dashboardDAO; }
    public DepartmentDAO getDepartmentDAO() { return departmentDAO; }
    public EmployeeDAO getEmployeeDAO() { return employeeDAO; }
    public RequestDAO getRequestDAO() { return requestDAO; }
    public RequestsController getRequestsController() { return requestsController; }
    public DepartmentsController getDepartmentsController() { return departmentsController; }
    public ProfileController getProfileController() { return profileController; }
    public Map<Integer, String> getStatusOverrides() { return statusOverrides; }
    public Runnable getActiveRequestsRefresh() { return activeRequestsRefresh; }
    public Runnable getActiveRequestsReset() { return activeRequestsReset; }
    public void setActiveRequestsRefresh(Runnable r) { this.activeRequestsRefresh = r; }
    public void setActiveRequestsReset(Runnable r) { this.activeRequestsReset = r; }

    public Button getBtnDashboard() { return btnDashboard; }
    public void setBtnDashboard(Button btn) { this.btnDashboard = btn; }
    public Button getProfileButton() { return profileButton; }
    public void setProfileButton(Button btn) { this.profileButton = btn; }
    public Button getDepartmentsButton() { return departmentsButton; }
    public void setDepartmentsButton(Button btn) { this.departmentsButton = btn; }
    public Button getVacationsButton() { return vacationsButton; }
    public void setVacationsButton(Button btn) { this.vacationsButton = btn; }
    public Button getDisabilitiesButton() { return disabilitiesButton; }
    public void setDisabilitiesButton(Button btn) { this.disabilitiesButton = btn; }
    public Button getPermissionsButton() { return permissionsButton; }
    public void setPermissionsButton(Button btn) { this.permissionsButton = btn; }
    public Button getMaternityButton() { return maternityButton; }
    public void setMaternityButton(Button btn) { this.maternityButton = btn; }

    public AppLayout getLayout() { return layout; }
    public void setLayout(AppLayout layout) { this.layout = layout; }

    // ----- Login success -----
    public void onLoginSuccess() {
        root = new BorderPane();
        root.getStyleClass().add("app-root");
        appFrame = new StackPane(root);
        appFrame.getStyleClass().add("app-frame");

        layout = new AppLayout(this, createNavigationHandler());
        root.setLeft(layout.createSidebar());

        requestsController = new RequestsController(stage, appFrame, authDAO, requestDAO, departmentDAO, employeeDAO, statusOverrides, activeRequestsRefresh, activeRequestsReset);
        departmentsController = new DepartmentsController(appFrame, authDAO, departmentDAO);
        profileController = new ProfileController(appFrame, authDAO, employeeDAO);

        layout.setActive(btnDashboard);
        showDashboard();

        Scene scene = new Scene(appFrame, 1440, 900);
        scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
        stage.setScene(scene);
        stage.setMinWidth(1280);
        stage.setMinHeight(800);
        forceMaximized();
    }

    private AppLayout.NavigationHandler createNavigationHandler() {
        return new AppLayout.NavigationHandler() {
            @Override public void navigateToDashboard() { showDashboard(); }
            @Override public void navigateToProfile() { layout.setActive(profileButton); profileController.setProfileView(); }
            @Override public void navigateToDepartments() { layout.setActive(departmentsButton); departmentsController.setDepartmentsView(); }
            @Override public void navigateToVacations() { layout.setActive(vacationsButton); requestsController.setVacationsView(); }
            @Override public void navigateToDisabilities() { layout.setActive(disabilitiesButton); requestsController.setRequestsView("Incapacidades", "Incapacidad"); }
            @Override public void navigateToPermissions() { layout.setActive(permissionsButton); requestsController.setRequestsView("Permisos", "Permiso"); }
            @Override public void navigateToMaternity() { layout.setActive(maternityButton); requestsController.setRequestsView("Licencia por maternidad", "Licencia maternidad"); }
        };
    }

    public void showDashboard() {
        layout.setActive(btnDashboard);
        DashboardView dashboard = new DashboardView(this, layout);
        layout.setCenterPage(dashboard.build());
    }

    public void openRequestModule(String type) {
        switch (type == null ? "" : type) {
            case "Incapacidad" -> { layout.setActive(disabilitiesButton); requestsController.setRequestsView("Incapacidades", "Incapacidad"); }
            case "Permiso" -> { layout.setActive(permissionsButton); requestsController.setRequestsView("Permisos", "Permiso"); }
            case "Licencia maternidad" -> { layout.setActive(maternityButton); requestsController.setRequestsView("Licencia por maternidad", "Licencia maternidad"); }
            default -> { layout.setActive(vacationsButton); requestsController.setRequestsView("Vacaciones", "Vacaciones"); }
        }
    }

    // ----- Window management -----
    public void forceMaximized() {
        if (stage == null) return;
        stage.setFullScreen(false);
        applyVisualBounds();
        stage.setMaximized(true);
        Platform.runLater(() -> {
            applyVisualBounds();
            stage.setMaximized(true);
        });
        Platform.runLater(() -> Platform.runLater(() -> {
            applyVisualBounds();
            stage.setMaximized(true);
        }));
    }

    private void installFullWindowGuard() {
        stage.iconifiedProperty().addListener((noteText, wasIconified, isIconified) -> {
            if (!isIconified) Platform.runLater(this::forceMaximized);
        });
        stage.maximizedProperty().addListener((noteText, wasMaximized, isMaximized) -> {
            if (!isMaximized && !stage.isIconified()) {
                Platform.runLater(this::forceMaximized);
            }
        });
        stage.sceneProperty().addListener((noteText, oldScene, newScene) -> Platform.runLater(this::forceMaximized));
    }

    private void applyVisualBounds() {
        try {
            javafx.geometry.Rectangle2D bounds = javafx.stage.Screen.getPrimary().getVisualBounds();
            stage.setX(bounds.getMinX());
            stage.setY(bounds.getMinY());
            stage.setWidth(bounds.getWidth());
            stage.setHeight(bounds.getHeight());
        } catch (Exception ignored) {}
    }

    // ----- Overlay / Modal methods -----
    public StackPane modalOverlay(VBox card) {
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

    public void closeOverlay(StackPane overlay) {
        if (appFrame != null && overlay != null) {
            appFrame.getChildren().remove(overlay);
        }
    }

    public void showAlert(String title, String message) {
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

    public void showLogoutConfirmation() {
        if (appFrame == null) {
            LoginView login = new LoginView(this);
            login.show();
            return;
        }
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
            appFrame = null;
            LoginView login = new LoginView(this);
            login.show();
        });
    }
}
