/**
 * Copyright (c) 2010, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
package com.zocia.roundtable.scheduling;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.web.context.WebApplicationContext;

import javax.servlet.ServletContext;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;

/**
 * This class provides a way to make sure only one VM in the cluster executes the schedued task.
 * Hazelcast is used for its distributed locking capability to make sure the task only runs on
 * one server. A "TimeKey" is generated which acts as our unique identifier of the task. If the
 * TimeKey is found in the Hazelcast structure, the task does not execute. The first server who
 * does _not_ find the TimeKey in the Hazelcast structure, will write the TimeKey effectively
 * claiming responsibility for executing the task.
 * <p/>
 * The system clocks for all VMs in the cluster must be synced in order for this approach to
 * work. In order to calculate a TimeKey, the current system time is rounded to a specified
 * interval. All clocks in the cluster need to round to the same interval in order for this to
 * work.
 */
public class DistributedWebCronJob implements ApplicationContextAware {

    // Constants -------------------------------------------------------------------

    private static final Logger LOG = LoggerFactory.getLogger(DistributedWebCronJob.class);

    // Instances -------------------------------------------------------------------

    private String _contextPath;
    private String _localUrl;
    private String _index;
    private String _name;

    private long _seconds;

    private ScheduleUtil _scheduleUtil;

    // Constructors ----------------------------------------------------------------

    public DistributedWebCronJob() {
        _scheduleUtil = new ScheduleUtil();
    }

    // ApplicationContextAware implementation --------------------------------------

    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        if (applicationContext instanceof WebApplicationContext) {
            ServletContext servletContext = ((WebApplicationContext) applicationContext).getServletContext();
            _contextPath = servletContext.getContextPath();
        }
    }

    // Publics ---------------------------------------------------------------------

    public void run() {
        boolean canRun = _scheduleUtil.canRunTask(_localUrl, _seconds);
        if (canRun) {
            LOG.debug("Job [{}] will be executed by this instance.", _name);
            boolean success = invokeGetRequest(_localUrl);
            if (!success) {
                // Try again next time
                LOG.debug("Job [{}] failed. Will be added back to queue.", _name);
                _scheduleUtil.didNotRunTask(_localUrl, _seconds);
            }
        } else {
            LOG.debug("Job [{}] will not be executed by this instance.", _name);
        }
    }

    // Properties ------------------------------------------------------------------

    public void setLocalUrl(final String localUrl) {
        _localUrl = localUrl;
        if (_name == null) _name = _localUrl;
    }

    public void setIndex(final String index) {
        _index = index;
    }

    public void setName(final String name) {
        _name = name;
    }

    public void setSeconds(final long seconds) {
        _seconds = seconds;
    }

    // Protecteds ------------------------------------------------------------------

    protected boolean invokeGetRequest(String urlName) {
        try {
            URL url = new URL(urlName);
            return get(url);
        } catch (MalformedURLException e) {
            LOG.error("Failed to trigger CRON job", e);
        }
        return false;
    }

    protected boolean get(URL url) {
        try {
            LOG.debug("Invoking URL: {}", url);
            URLConnection conn = url.openConnection();
            conn.setRequestProperty("x-rt-index", _index);

            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            try {
                while (in.readLine() != null) ;
                return true;
            } finally {
                in.close();
            }
        } catch (IOException e) {
            LOG.warn("Error while executing HTTP request: " + url, e);
        }
        return false;
    }
}
