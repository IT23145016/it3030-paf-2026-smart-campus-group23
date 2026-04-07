package com.scoh.api.config;

import com.scoh.api.domain.Role;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.bson.Document;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

@Configuration
public class MongoRoleConfig {

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new StringToRoleConverter(),
                new DocumentToRoleConverter(),
                new RoleToStringConverter()));
    }

    @ReadingConverter
    static class StringToRoleConverter implements Converter<String, Role> {

        @Override
        public Role convert(String source) {
            return normalizeRole(source);
        }
    }

    @ReadingConverter
    static class DocumentToRoleConverter implements Converter<Document, Role> {

        @Override
        public Role convert(Document source) {
            Object candidate = firstNonNull(
                    source.get("data"),
                    source.get("value"),
                    source.get("name"),
                    source.get("_value"));
            return normalizeRole(candidate);
        }
    }

    @WritingConverter
    static class RoleToStringConverter implements Converter<Role, String> {

        @Override
        public String convert(Role source) {
            return source.name();
        }
    }

    private static Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private static Role normalizeRole(Object rawRole) {
        if (rawRole == null) {
            throw new IllegalArgumentException("Role value is missing.");
        }
        if (rawRole instanceof Role role) {
            return role;
        }
        if (rawRole instanceof Map<?, ?> map) {
            return normalizeRole(firstNonNull(
                    map.get("data"),
                    map.get("value"),
                    map.get("name"),
                    map.get("_value")));
        }

        String normalized = rawRole.toString().trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring("ROLE_".length());
        }
        if (normalized.endsWith(".DATA")) {
            normalized = normalized.substring(0, normalized.length() - ".DATA".length());
        }
        return Role.valueOf(normalized);
    }
}
