package com.talento360.app;

import java.util.List;

import com.talento360.utils.UIUtils;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.ContentDisplay;
import javafx.scene.control.Label;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;
import javafx.scene.control.ScrollPane;
import javafx.scene.control.Tooltip;
import javafx.scene.image.ImageView;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.shape.Circle;

public class AppLayout {

    private final AppContext ctx;
    private final NavigationHandler handler;

    public AppLayout(AppContext ctx, NavigationHandler handler) {
        this.ctx = ctx;
        this.handler = handler;
    }

    public interface NavigationHandler {
        void navigateToDashboard();
        void navigateToProfile();
        void navigateToDepartments();
        void navigateToVacations();
        void navigateToDisabilities();
        void navigateToPermissions();
        void navigateToMaternity();
    }

    public VBox createSidebar() {
        VBox sidebar = new VBox(8);
        sidebar.getStyleClass().add("sidebar");
        sidebar.setPrefWidth(268);
        sidebar.setPadding(new Insets(24, 0, 0, 0));

        ImageView logo = UIUtils.image("/assets/talento_logo_card.png", 218, 128, true);
        StackPane logoCard = new StackPane(logo);
        logoCard.getStyleClass().add("sidebar-logo-card");
        logoCard.setPrefHeight(134);
        VBox.setMargin(logoCard, new Insets(0, 16, 12, 16));

        ctx.setBtnDashboard(sidebarButton("/assets/sidebar_dashboard.png", "Dashboard"));
        ctx.setProfileButton(sidebarButton("/assets/sidebar_profile.png", "Perfil"));
        ctx.setDepartmentsButton(sidebarButton("/assets/sidebar_dependencies.png", "Dependencias"));
        ctx.setVacationsButton(sidebarButton("/assets/sidebar_vacations.png", "Vacaciones"));
        ctx.setDisabilitiesButton(sidebarButton("/assets/sidebar_incapacity.png", "Incapacidades"));
        ctx.setPermissionsButton(sidebarButton("/assets/sidebar_permissions.png", "Permisos"));
        ctx.setMaternityButton(sidebarButton("/assets/sidebar_maternity.png", "Licencia por\nmaternidad"));

        ctx.getBtnDashboard().setOnAction(e -> handler.navigateToDashboard());
        ctx.getProfileButton().setOnAction(e -> handler.navigateToProfile());
        ctx.getDepartmentsButton().setOnAction(e -> handler.navigateToDepartments());
        ctx.getVacationsButton().setOnAction(e -> handler.navigateToVacations());
        ctx.getPermissionsButton().setOnAction(e -> handler.navigateToPermissions());
        ctx.getDisabilitiesButton().setOnAction(e -> handler.navigateToDisabilities());
        ctx.getMaternityButton().setOnAction(e -> handler.navigateToMaternity());

        for (Button b : List.of(ctx.getBtnDashboard(), ctx.getProfileButton(), ctx.getDepartmentsButton(), ctx.getVacationsButton(), ctx.getDisabilitiesButton(), ctx.getPermissionsButton(), ctx.getMaternityButton())) {
            VBox.setMargin(b, new Insets(0, 16, 3, 16));
        }

        Region spacer = new Region();
        VBox.setVgrow(spacer, Priority.ALWAYS);

        StackPane cityFrame = new StackPane();
        cityFrame.getStyleClass().add("sidebar-city-frame");
        cityFrame.setMinHeight(220);
        cityFrame.setPrefHeight(235);
        cityFrame.setMaxHeight(250);
        cityFrame.setPrefWidth(268);
        cityFrame.setMaxWidth(Double.MAX_VALUE);
        ImageView city = UIUtils.image("/assets/sidebar_city.png", 268, 235, false);
        city.setOpacity(0.38);
        StackPane.setAlignment(city, Pos.BOTTOM_CENTER);

        VBox cityText = new VBox(2);
        cityText.setAlignment(Pos.BOTTOM_LEFT);
        cityText.setPadding(new Insets(0, 0, 18, 14));
        Label line = new Label("Talento 360 Humano");
        line.getStyleClass().add("sidebar-city-title");
        Label sub = new Label("Gobernación de Boyacá");
        sub.getStyleClass().add("sidebar-city-subtitle");
        cityText.getChildren().addAll(line, sub);

        VBox userSummary = sidebarUserSummary();
        VBox.setMargin(userSummary, new Insets(6, 16, 0, 16));

        Region profileTopGap = new Region();
        profileTopGap.setMinHeight(6);
        profileTopGap.setPrefHeight(8);
        Region citySpacer = new Region();
        VBox.setVgrow(citySpacer, Priority.ALWAYS);
        VBox cityOverlay = new VBox(0, profileTopGap, userSummary, citySpacer, cityText);
        cityOverlay.setFillWidth(true);
        cityFrame.getChildren().addAll(city, cityOverlay);

        sidebar.getChildren().addAll(logoCard, ctx.getBtnDashboard(), ctx.getProfileButton(), ctx.getDepartmentsButton(), ctx.getVacationsButton(), ctx.getDisabilitiesButton(), ctx.getPermissionsButton(), ctx.getMaternityButton(), spacer, cityFrame);
        return sidebar;
    }

    private VBox sidebarUserSummary() {
        VBox card = new VBox(7);
        card.getStyleClass().add("sidebar-user-card");
        HBox row = new HBox(10);
        row.setAlignment(Pos.CENTER_LEFT);

        ImageView avatar = UIUtils.image("/assets/default_avatar.png", 42, 42, true);
        Circle clip = new Circle(21, 21, 21);
        avatar.setClip(clip);

        VBox texts = new VBox(2);
        Label name = new Label(ctx.getAuthDAO().getCurrentName());
        name.getStyleClass().add("sidebar-user-name");
        name.setWrapText(true);
        Label role = new Label(ctx.getAuthDAO().getCurrentJobTitle());
        role.getStyleClass().add("sidebar-user-role");
        role.setWrapText(true);
        Label dep = new Label(ctx.getAuthDAO().getCurrentDepartment());
        dep.getStyleClass().add("sidebar-user-dep");
        dep.setWrapText(true);
        texts.getChildren().addAll(name, role, dep);
        row.getChildren().addAll(avatar, texts);
        card.getChildren().add(row);
        return card;
    }

    private Button sidebarButton(String assetPath, String text) {
        Button button = new Button(text);
        if (assetPath != null) {
            ImageView iv = UIUtils.image(assetPath, 22, 22, true);
            button.setGraphic(iv);
        }
        button.setContentDisplay(ContentDisplay.LEFT);
        button.setGraphicTextGap(13);
        button.getStyleClass().add("sidebar-button");
        button.setMaxWidth(Double.MAX_VALUE);
        button.setAlignment(Pos.CENTER_LEFT);
        return button;
    }

    public void setActive(Button active) {
        for (Button b : List.of(ctx.getBtnDashboard(), ctx.getProfileButton(), ctx.getDepartmentsButton(), ctx.getVacationsButton(), ctx.getDisabilitiesButton(), ctx.getPermissionsButton(), ctx.getMaternityButton())) {
            if (b != null) b.getStyleClass().remove("sidebar-button-active");
        }
        if (active != null && !active.getStyleClass().contains("sidebar-button-active")) {
            active.getStyleClass().add("sidebar-button-active");
        }
    }

    public HBox topBar() {
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
        logout.setOnAction(e -> ctx.showLogoutConfirmation());

        MenuButton userMenu = new MenuButton(ctx.getAuthDAO().getCurrentName() + "  •  " + ctx.getAuthDAO().getCurrentRole(), avatarStack, logout);
        userMenu.getStyleClass().add("top-user-menu");
        userMenu.setContentDisplay(ContentDisplay.LEFT);
        userMenu.setGraphicTextGap(8);

        header.getChildren().addAll(title, spacer, userMenu);
        return header;
    }

    public VBox pageShell() {
        VBox shell = new VBox(0);
        shell.getChildren().add(topBar());
        VBox.setVgrow(shell, Priority.ALWAYS);
        return shell;
    }

    public void setCenterPage(VBox shell) {
        ScrollPane scroll = new ScrollPane(shell);
        scroll.setFitToWidth(true);
        scroll.setFitToHeight(true);
        scroll.getStyleClass().add("main-scroll");
        ctx.getRoot().setCenter(scroll);
    }

    public HBox footerBar() {
        HBox footer = new HBox();
        footer.setAlignment(Pos.CENTER);
        footer.getStyleClass().add("footer-bar");
        Label fl = new Label("Talento 360 Humano   •   Gobernación de Boyacá   •   2026");
        fl.getStyleClass().add("muted");
        footer.getChildren().add(fl);
        return footer;
    }
}
