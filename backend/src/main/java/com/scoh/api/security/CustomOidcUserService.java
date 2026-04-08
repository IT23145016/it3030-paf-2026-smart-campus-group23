package com.scoh.api.security;

import com.scoh.api.domain.UserAccount;
import com.scoh.api.service.UserAccountService;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class CustomOidcUserService extends OidcUserService {

    private final UserAccountService userAccountService;

    public CustomOidcUserService(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName() != null ? oidcUser.getFullName() : oidcUser.getGivenName();
        String picture = oidcUser.getPicture();
        String provider = userRequest.getClientRegistration().getRegistrationId();
        String providerId = oidcUser.getSubject();

        UserAccount user = userAccountService.upsertOAuthUser(email, name, picture, provider, providerId);
        if (!user.isActive()) {
            throw new DisabledException("This account has been deactivated by an administrator.");
        }
        return new AppOidcUser(user, oidcUser);
    }
}
