package com.scoh.api.security;

import com.scoh.api.domain.UserAccount;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

public class AppOidcUser extends DefaultOidcUser {

    private final UserAccount user;

    public AppOidcUser(UserAccount user, OidcUser delegate) {
        super(
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                        .toList(),
                delegate.getIdToken(),
                delegate.getUserInfo(),
                "email");
        this.user = user;
    }

    public UserAccount getUser() {
        return user;
    }
}
