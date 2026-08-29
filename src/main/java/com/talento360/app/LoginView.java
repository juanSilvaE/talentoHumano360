package com.talento360.app;

import com.talento360.utils.UIUtils;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.ContentDisplay;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.Separator;
import javafx.scene.control.TextField;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class LoginView {

    private final AppContext ctx;

    public LoginView(AppContext ctx) {
        this.ctx = ctx;
    }

    public void show() {
        Stage stage = ctx.getStage();

        HBox wrapper = new HBox();
        wrapper.getStyleClass().add("login-wrapper");
        wrapper.setAlignment(Pos.CENTER);
        wrapper.setMaxSize(Double.MAX_VALUE, Double.MAX_VALUE);

        StackPane left = new StackPane();
        left.getStyleClass().add("login-left");
        left.setMinWidth(420);
        left.setPrefWidth(640);
        left.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(left, Priority.ALWAYS);
        ImageView bg = UIUtils.image("/assets/login_left_panel.png", 640, 820, false);
        bg.fitWidthProperty().bind(left.widthProperty());
        bg.fitHeightProperty().bind(left.heightProperty());
        bg.setPreserveRatio(false);
        bg.setSmooth(true);
        bg.setOpacity(0.90);
        left.getChildren().add(bg);

        VBox panel = new VBox(14);
        panel.getStyleClass().add("login-panel");
        panel.setAlignment(Pos.CENTER_LEFT);
        panel.setMinWidth(540);
        panel.setPrefWidth(620);
        panel.setMaxWidth(720);
        HBox.setHgrow(panel, Priority.NEVER);

        ImageView logo = UIUtils.image("/assets/login_logo.png", 370, 145, true);
        VBox logoBox = new VBox(logo);
        logoBox.setAlignment(Pos.CENTER);
        logoBox.setPadding(new Insets(0, 0, 8, 0));

        Label welcome = new Label("Bienvenido(a)");
        welcome.getStyleClass().add("login-title");
        Label subtitle = new Label("Inicia sesión para acceder al sistema Talento 360 Humano.");
        subtitle.getStyleClass().add("muted");

        Label userLabel = new Label("Usuario");
        userLabel.getStyleClass().add("field-label");
        HBox userRow = UIUtils.fieldWithIcon("\uD83D\uDC64", "Ingresa tu usuario");
        TextField userField = (TextField) ((HBox) userRow).getChildren().get(1);

        Label passLabel = new Label("Contraseña");
        passLabel.getStyleClass().add("field-label");
        HBox passRow = new HBox(0);
        passRow.getStyleClass().add("input");
        passRow.setAlignment(Pos.CENTER_LEFT);
        Label lockIcon = new Label("\uD83D\uDD12 ");
        lockIcon.setStyle("-fx-text-fill: #9aaabb; -fx-font-size: 14px;");
        PasswordField passwordField = new PasswordField();
        passwordField.setPromptText("Ingresa tu contraseña");
        passwordField.setStyle("-fx-background-color: transparent; -fx-border-color: transparent; -fx-padding: 0; -fx-font-size: 14px;");

        TextField visiblePasswordField = new TextField();
        visiblePasswordField.setPromptText("Ingresa tu contraseña");
        visiblePasswordField.setStyle("-fx-background-color: transparent; -fx-border-color: transparent; -fx-padding: 0; -fx-font-size: 14px;");
        visiblePasswordField.textProperty().bindBidirectional(passwordField.textProperty());
        visiblePasswordField.setVisible(false);
        visiblePasswordField.setManaged(false);

        passwordField.setMaxWidth(Double.MAX_VALUE);
        visiblePasswordField.setMaxWidth(Double.MAX_VALUE);
        StackPane passwordStack = new StackPane(passwordField, visiblePasswordField);
        passwordStack.setMaxWidth(Double.MAX_VALUE);
        HBox.setHgrow(passwordStack, Priority.ALWAYS);

        StackPane eyeIcon = new StackPane(UIUtils.image("/assets/icon_eye_login.png", 18, 18, true));
        eyeIcon.setStyle("-fx-cursor: hand; -fx-padding: 0 0 0 10;");
        final boolean[] passwordVisible = {false};
        eyeIcon.setOnMouseClicked(event -> {
            passwordVisible[0] = !passwordVisible[0];
            passwordField.setVisible(!passwordVisible[0]);
            passwordField.setManaged(!passwordVisible[0]);
            visiblePasswordField.setVisible(passwordVisible[0]);
            visiblePasswordField.setManaged(passwordVisible[0]);
            if (passwordVisible[0]) {
                visiblePasswordField.requestFocus();
                visiblePasswordField.positionCaret(visiblePasswordField.getText().length());
            } else {
                passwordField.requestFocus();
                passwordField.positionCaret(passwordField.getText().length());
            }
        });
        passRow.getChildren().addAll(lockIcon, passwordStack, eyeIcon);

        Label forgot = new Label("¿Olvidaste tu contraseña?");
        forgot.getStyleClass().add("forgot");
        HBox forgotRow = new HBox(forgot);
        forgotRow.setAlignment(Pos.CENTER_RIGHT);

        Label error = new Label();
        error.getStyleClass().add("error");
        error.setVisible(false);
        error.setManaged(false);

        Button loginButton = new Button("  Iniciar sesión");
        loginButton.getStyleClass().add("login-button");
        loginButton.setMaxWidth(Double.MAX_VALUE);
        Label lockBtn = new Label("\uD83D\uDD12");
        lockBtn.setStyle("-fx-text-fill: white; -fx-font-size: 16px;");
        loginButton.setGraphic(lockBtn);
        loginButton.setContentDisplay(ContentDisplay.LEFT);
        loginButton.setGraphicTextGap(8);
        loginButton.setDefaultButton(true);
        Runnable loginAction = () -> {
            error.setVisible(false);
            error.setManaged(false);
            loginButton.setDisable(true);
            try {
                if (ctx.getAuthDAO().login(userField.getText(), passwordField.getText())) {
                    ctx.onLoginSuccess();
                } else {
                    error.setText("\u26A0  Usuario, contraseña o conexión incorrecta.");
                    error.setVisible(true);
                    error.setManaged(true);
                    loginButton.setDisable(false);
                }
            } catch (Throwable ex) {
                ex.printStackTrace();
                error.setText("\u26A0  No se pudo iniciar sesión. Revisa la conexión o las credenciales.");
                error.setVisible(true);
                error.setManaged(true);
                loginButton.setDisable(false);
            }
        };
        loginButton.setOnAction(e -> loginAction.run());
        passwordField.setOnAction(e -> loginAction.run());
        visiblePasswordField.setOnAction(e -> loginAction.run());
        userField.setOnAction(e -> passwordField.requestFocus());

        HBox goldSepRow = new HBox();
        goldSepRow.setAlignment(Pos.CENTER);
        goldSepRow.setPadding(new Insets(6, 0, 6, 0));
        Separator sep1 = new Separator();
        sep1.getStyleClass().add("gold-separator");
        HBox.setHgrow(sep1, Priority.ALWAYS);
        Region dot = new Region();
        dot.getStyleClass().add("gold-dot");
        dot.setMinSize(8, 8);
        dot.setMaxSize(8, 8);
        Separator sep2 = new Separator();
        sep2.getStyleClass().add("gold-separator");
        HBox.setHgrow(sep2, Priority.ALWAYS);
        goldSepRow.getChildren().addAll(sep1, dot, sep2);

        HBox secureBox = new HBox(10);
        secureBox.setAlignment(Pos.CENTER);
        StackPane shieldIcon = new StackPane(UIUtils.image("/assets/icon_shield_unique.png", 22, 22, true));
        shieldIcon.getStyleClass().add("login-asset-icon-slot");
        VBox secureTexts = new VBox(2);
        Label secureTitle = new Label("Acceso seguro");
        secureTitle.setStyle("-fx-font-weight: bold; -fx-font-size: 13px; -fx-text-fill: #0c6b52;");
        Label secureSubtitle = new Label("Tus datos están protegidos");
        secureSubtitle.setStyle("-fx-font-size: 11px; -fx-text-fill: #3d7a6a;");
        secureTexts.getChildren().addAll(secureTitle, secureSubtitle);
        secureBox.getChildren().addAll(shieldIcon, secureTexts);

        panel.getChildren().addAll(logoBox, welcome, subtitle, userLabel, userRow, passLabel, passRow,
                forgotRow, loginButton, error, goldSepRow, secureBox);
        wrapper.getChildren().addAll(left, panel);

        StackPane container = new StackPane(wrapper);
        container.getStyleClass().add("login-background");
        Scene scene = new Scene(container, 1280, 820);
        scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());
        stage.setScene(scene);
        stage.setMinWidth(1180);
        stage.setMinHeight(760);
        ctx.forceMaximized();
    }
}
