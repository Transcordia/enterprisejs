/**
 * Copyright (c) 2010, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
package com.zocia.security;

import java.util.Map;

import org.eclipse.jetty.client.ContentExchange;
import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.client.HttpExchange;
import org.eclipse.jetty.io.ByteArrayBuffer;
import org.eclipse.jetty.util.ajax.JSON;
import org.eclipse.jetty.util.thread.QueuedThreadPool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataRetrievalFailureException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public class RESTUserDetailsService implements UserDetailsService {

	private static final Logger LOG = LoggerFactory.getLogger(RESTUserDetailsService.class);

	private String userUrl;
	private HttpClient client;

	public RESTUserDetailsService() {
	}

	private HttpClient getClient() throws Exception {
		if (client == null) {
			client = new HttpClient();
			client.setConnectorType(HttpClient.CONNECTOR_SELECT_CHANNEL);
			client.setMaxConnectionsPerAddress(200); // max 200 concurrent connections to every address
			client.setThreadPool(new QueuedThreadPool(250)); // max 250 threads
			client.setTimeout(30000); // 30 seconds timeout; if no server reply, the request expires
			client.start();
		}
		return client;
	}

	/**
	 * Locates the user based on the username. In the actual implementation, the search may possibly
	 * be case insensitive, or case insensitive depending on how the implementation instance is
	 * configured. In this case, the <code>UserDetails</code> object that comes back may have a
	 * username that is of a different case than what was actually requested..
	 *
	 * @param username the username identifying the user whose data is required.
	 * @return a fully populated user record (never <code>null</code>)
	 * @throws org.springframework.security.core.userdetails.UsernameNotFoundException
	 *          if the user could not be found or the user has no GrantedAuthority
	 * @throws org.springframework.dao.DataAccessException
	 *          if user could not be found for a repository-specific reason
	 */
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException, DataAccessException {
		LOG.debug("Fetching user profile for authentication: " + username);

		String query = String.format("{ \"query\": { \"field\": { \"username\": \"%s\" } } } ", username);

		try {
			ContentExchange exchange = new ContentExchange(true);
			exchange.setMethod("POST");
			exchange.setRequestHeader("x-rt-index", "ejs");
			exchange.setURL(getUserUrl());
			exchange.setRequestContentType("application/json");
			exchange.setRequestContent(new ByteArrayBuffer(query.getBytes("UTF-8")));

			getClient().send(exchange);

			int exchangeState = exchange.waitForDone();

			if (exchangeState == HttpExchange.STATUS_COMPLETED) {

				if (exchange.getResponseStatus() == 200) {
					LOG.debug("Retrieved user: " + exchange.getResponseContent());
					final Object json = JSON.parse(exchange.getResponseContent());
					if (json instanceof Object[]) {
						if (((Object[]) json).length > 0) {
							final Map user = (Map) ((Object[]) json)[0];
							return new RoundtableUser(user);
						}
					}
				}

				LOG.warn("Request failed with a status code of " + exchange.getResponseStatus());
				throw new UsernameNotFoundException("Bad Credentials");
			} else if (exchangeState == HttpExchange.STATUS_EXCEPTED) {
				LOG.warn("Unexpected error while getting user details for " + username);
				throw new DataRetrievalFailureException(
						"Unexpected error while getting user details for " + username);
			} else if (exchangeState == HttpExchange.STATUS_EXPIRED) {
				LOG.warn("Timeout while getting user details for " + username);
				throw new DataRetrievalFailureException(
						"Timeout while getting user details for " + username);
			}
			throw new UsernameNotFoundException("Authentication Failed");
		} catch (Exception e) {
			LOG.warn("Unexpected error while getting user details for " + username, e);
			throw new DataRetrievalFailureException(
					"Unexpected error while getting user details for " + username, e);
		}
	}

	public String getUserUrl() {
		return userUrl;
	}

	public void setUserUrl(String userUrl) {
		this.userUrl = userUrl;
	}
}
