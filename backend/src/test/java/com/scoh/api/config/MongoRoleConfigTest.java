package com.scoh.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.scoh.api.domain.Role;
import org.bson.Document;
import org.junit.jupiter.api.Test;

class MongoRoleConfigTest {

    @Test
    void shouldReadLegacyDocumentRoleValue() {
        MongoRoleConfig.DocumentToRoleConverter converter = new MongoRoleConfig.DocumentToRoleConverter();

        Role role = converter.convert(new Document("data", "ADMIN"));

        assertThat(role).isEqualTo(Role.ADMIN);
    }

    @Test
    void shouldReadPrefixedRoleValue() {
        MongoRoleConfig.StringToRoleConverter converter = new MongoRoleConfig.StringToRoleConverter();

        Role role = converter.convert("ROLE_admin");

        assertThat(role).isEqualTo(Role.ADMIN);
    }
}
