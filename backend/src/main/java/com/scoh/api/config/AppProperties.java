package com.scoh.api.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Cors cors = new Cors();
    private OAuth2 oauth2 = new OAuth2();

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
}
