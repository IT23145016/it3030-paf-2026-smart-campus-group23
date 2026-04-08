package com.scoh.api.config;

import com.scoh.api.service.UserAccountService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminAccountSeeder {

    @Bean
    ApplicationRunner seedMemberFourAccounts(UserAccountService userAccountService, AppProperties appProperties) {
        return args -> {
            userAccountService.ensureBootstrapRole(
                    appProperties.getBootstrap().getAdminEmail(),
                    true);
            userAccountService.ensureBootstrapRole(
                    appProperties.getBootstrap().getDefaultUserEmail(),
                    false);
        };
    }
}
