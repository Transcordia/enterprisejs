/**
 * Copyright (c) 2010, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
package com.zocia.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

public class RoundtableUser implements UserDetails {

	private static final Logger LOG = LoggerFactory.getLogger(RoundtableUser.class);

	private String id;
	private String username;
	private String password;
	private Collection<GrantedAuthority> authorities;
	private String name = "";
	private String email;
    private String country;
	private String profileType;
    private String accountType;
    private String thumbnail;
    private String status;


    public RoundtableUser(Map user) {
		LOG.debug("Generating new RoundtableUser for user: {}", user.get("username"));
		this.id = (String) user.get("_id");
		this.username = (String) user.get("username");
		this.password = ((String) user.get("password")).toLowerCase();
        this.country = (String) user.get("country");
		this.profileType = (String) user.get("profileType");
        this.accountType = (String) user.get("accountType");
        this.thumbnail = (String) user.get("thumbnail");
        this.status = (String) user.get("status");

		if (user.get("name") != null) {
			this.name = (String) ((Map) user.get("name")).get("fullName");
		}
		this.email = (String) ((Map) user.get("accountEmail")).get("address");

		// Generate Spring authorities
		this.authorities = new ArrayList<GrantedAuthority>();
        Object[] roles = (Object[]) user.get("roles");
        for (Object role : roles) {
            if (role instanceof String)
                this.authorities.add(new SimpleGrantedAuthority((String) role));
        }

/*
		// Add an "admin" role to the admin user
		this.authorities.add(new GrantedAuthorityImpl("ROLE_USER"));
 		if ("admin".equalsIgnoreCase((String)user.get("username"))) {
			this.authorities.add(new GrantedAuthorityImpl("ROLE_ADMIN"));
 		}
*/
	}

	/**
	 * Returns the authorities granted to the user. Cannot return <code>null</code>.
	 *
	 * @return the authorities, sorted by natural key (never <code>null</code>)
	 */
	public Collection<GrantedAuthority> getAuthorities() {
		return authorities;
	}

	/**
	 * Returns the password used to authenticate the user. Cannot return <code>null</code>.
	 *
	 * @return the password (never <code>null</code>)
	 */
	public String getPassword() {
		return password;
	}

	/**
	 * Returns the username used to authenticate the user. Cannot return <code>null</code>.
	 *
	 * @return the username (never <code>null</code>)
	 */
	public String getUsername() {
		return username;
	}

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    /**
	 * Returns the 2 letter country code of authenticated user. Cannot return <code>null</code>.
	 *
	 * @return the country code (never <code>null</code>)
	 */
	public String getCountry() {
		return country;
	}

	/**
	 * Indicates whether the user's account has expired. An expired account cannot be authenticated.
	 *
	 * @return <code>true</code> if the user's account is valid (ie non-expired), <code>false</code> if no longer valid
	 *         (ie expired)
	 */
	public boolean isAccountNonExpired() {
		return true;
	}

	/**
	 * Indicates whether the user is locked or unlocked. A locked user cannot be authenticated.
	 *
	 * @return <code>true</code> if the user is not locked, <code>false</code> otherwise
	 */
	public boolean isAccountNonLocked() {
		return (status.equalsIgnoreCase("verified"));
	}

	/**
	 * Indicates whether the user's credentials (password) has expired. Expired credentials prevent
	 * authentication.
	 *
	 * @return <code>true</code> if the user's credentials are valid (ie non-expired), <code>false</code> if no longer
	 *         valid (ie expired)
	 */
	public boolean isCredentialsNonExpired() {
		return true;
	}

	/**
	 * Indicates whether the user is enabled or disabled. A disabled user cannot be authenticated.
	 *
	 * @return <code>true</code> if the user is enabled, <code>false</code> otherwise
	 */
	public boolean isEnabled() {
		return true;//(status == "verified");
	}

	public String getEmail() {
		return email;
	}

	public String getName() {
		return name;
	}

	public String getId() {
		return id;
	}

    public String getAccountType() {
		return accountType;
	}

	public boolean isUser() {
		return authorities.contains(new SimpleGrantedAuthority("ROLE_USER"));
	}

	public boolean isAdmin() {
		return authorities.contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
	}

    @Override
    public String toString() {
        return "RoundtableUser{" +
                "username='" + username + '\'' +
                ", profileType='" + profileType + '\'' +
                ", authorities=" + authorities +
                '}';
    }
}
