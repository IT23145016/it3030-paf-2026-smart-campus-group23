package com.scoh.api.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Cors cors = new Cors();
    private OAuth2 oauth2 = new OAuth2();
    private Bootstrap bootstrap = new Bootstrap();

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }

    public OAuth2 getOauth2() {
        return oauth2;
    }

    public void setOauth2(OAuth2 oauth2) {
        this.oauth2 = oauth2;
    }

    public Bootstrap getBootstrap() {
        return bootstrap;
    }

    public void setBootstrap(Bootstrap bootstrap) {
        this.bootstrap = bootstrap;
    }

    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5174");

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class OAuth2 {
        private String successRedirectUrl = "http://localhost:5174/auth/callback";
        private String logoutRedirectUrl = "http://localhost:5174/";

        public String getSuccessRedirectUrl() {
            return successRedirectUrl;
        }

        public void setSuccessRedirectUrl(String successRedirectUrl) {
            this.successRedirectUrl = successRedirectUrl;
        }

        public String getLogoutRedirectUrl() {
            return logoutRedirectUrl;
        }

        public void setLogoutRedirectUrl(String logoutRedirectUrl) {
            this.logoutRedirectUrl = logoutRedirectUrl;
        }
    }

    public static class Bootstrap {
        private String adminEmail = "mklskodithuwakku@gmail.com";
        private String defaultUserEmail = "kmls19kodituwakku@gmail.com";

        public String getAdminEmail() {
            return adminEmail;
        }

        public void setAdminEmail(String adminEmail) {
            this.adminEmail = adminEmail;
        }

        public String getDefaultUserEmail() {
            return defaultUserEmail;
        }

        public void setDefaultUserEmail(String defaultUserEmail) {
            this.defaultUserEmail = defaultUserEmail;
        }
    }
}
