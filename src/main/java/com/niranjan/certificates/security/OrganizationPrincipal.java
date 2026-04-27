package com.niranjan.certificates.security;

import com.niranjan.certificates.entity.Organization;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class OrganizationPrincipal implements UserDetails {

    private final UUID orgId;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;

    public OrganizationPrincipal(Organization organization) {
        this.orgId = organization.getId();
        this.email = organization.getEmail();
        this.password = organization.getPasswordHash();
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_ORG_ADMIN"));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
