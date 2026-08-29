package com.talento360;

import com.talento360.app.AppContext;
import com.talento360.app.LoginView;
import javafx.application.Application;
import javafx.stage.Stage;

public class MainApp extends Application {
    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage) {
        AppContext ctx = new AppContext(stage);
        LoginView login = new LoginView(ctx);
        login.show();
        stage.show();
        ctx.forceMaximized();
    }
}
