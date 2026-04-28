package com.impactbridge.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Handles DATABASE_URL conversion for cloud providers.
 * Render/Railway provide: postgres://user:pass@host:5432/dbname
 * Spring Boot needs:      jdbc:postgresql://host:5432/dbname
 *
 * If SPRING_DATASOURCE_URL is already set (direct JDBC format), this is a no-op.
 */
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties props = new DataSourceProperties();

        String databaseUrl = System.getenv("DATABASE_URL");
        String springUrl = System.getenv("SPRING_DATASOURCE_URL");

        // If SPRING_DATASOURCE_URL is set, use it directly (it's already in JDBC format)
        if (springUrl != null && !springUrl.isBlank()) {
            return props;
        }

        // Convert postgres:// or postgresql:// to jdbc:postgresql://
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            if (databaseUrl.startsWith("postgres://")) {
                databaseUrl = databaseUrl.replace("postgres://", "postgresql://");
            }
            if (databaseUrl.startsWith("postgresql://")) {
                // Extract user:pass from the URL
                try {
                    java.net.URI uri = new java.net.URI(databaseUrl);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null) {
                        String[] parts = userInfo.split(":");
                        props.setUsername(parts[0]);
                        if (parts.length > 1) {
                            props.setPassword(parts[1]);
                        }
                    }
                    String jdbcUrl = "jdbc:postgresql://" + uri.getHost()
                            + (uri.getPort() > 0 ? ":" + uri.getPort() : "")
                            + uri.getPath();
                    // Append query params (e.g., sslmode)
                    if (uri.getQuery() != null) {
                        jdbcUrl += "?" + uri.getQuery();
                    }
                    props.setUrl(jdbcUrl);
                } catch (Exception e) {
                    // If URI parsing fails, try setting directly with jdbc: prefix
                    props.setUrl("jdbc:" + databaseUrl);
                }
            } else if (!databaseUrl.startsWith("jdbc:")) {
                props.setUrl("jdbc:" + databaseUrl);
            } else {
                props.setUrl(databaseUrl);
            }
        }

        return props;
    }
}
