/**
 * Copyright (c) 2010, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
package com.zocia.roundtable.scheduling;

import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.ILock;
import com.hazelcast.core.IMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.Date;
import java.util.Deque;
import java.util.concurrent.TimeUnit;

/**
 * This class provides a utility function which can help ensure that only one VM in a cluster
 * handles a particular task.
 * <p/>
 * This class uses a Hazelcast map to store a collection of timestamps which have been or currently
 * are being executed. If there is an entry in the map, the current VM can continue on as some other
 * VM has taken responsibility for the task. If there is no entry, the current VM is responsible for
 * handling the task. We have to use Hazelcast locks to ensure transaction semantics.
 */
public class ScheduleUtil {

    // Constants -------------------------------------------------------------------

    private static final Logger LOG = LoggerFactory.getLogger(ScheduleUtil.class);
    private static final String MAP_NAME = "scheduledTasks";
    private static final int LOCK_TIMEOUT = 5000;
    private static final int MAX_KEYS = 40;

    // Instances -------------------------------------------------------------------

    final DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssz");
    final IMap<Object, Object> map;

    // Constructors ----------------------------------------------------------------


    public ScheduleUtil() {
        map = Hazelcast.getMap(MAP_NAME);
    }

    // Publics ---------------------------------------------------------------------

    /**
     * A Hazelcast map exists where the key is the taskType parameter and the value is a queue
     * containing a list of known TimeKeys. A TimeKey is an ISO 8601 timestamp generated from the
     * current system time and rounded to the provided interval.
     * <p/>
     * This map might look like this:
     * {
     * 'BackupTask': ['2011-06-11T14:15:00Z', '2011-06-11T14:30:00Z'],
     * 'HourlyTask': ['2011-06-11T08:00:00Z', '2011-06-11T09:00:00Z'],
     * }
     *
     * @param taskType
     * @param interval
     * @return
     */
    public boolean canRunTask(String taskType, long interval) {
        try {
            final String timeKey = getTimeKey(interval);
            LOG.debug("Generated TimeKey [{}] for task [{}]", timeKey, taskType);
            return weAreFirst(taskType, timeKey);
        } catch (InterruptedException e) {
            LOG.error("Error while attempting to evaluate scheduled task [{}]", taskType);
        }
        return false;
    }

    public void didNotRunTask(String taskType, long interval) {
        map.evict(taskType);
    }

        // Protecteds ------------------------------------------------------------------

    /**
     * A time key is a String representation of the snapshot time in ISO8601 format. It will be used as
     * the primary key of a stats snapshot.
     *
     * @param interval The time interval in ms to round to
     * @return An ISO8601 string representing the time rounded to the interval.
     */
    protected String getTimeKey(long interval) {
        // Round the date to the nearest interval.
        Date date = new Date();
        long time = date.getTime();
        time = (long) Math.floor((time + (interval >> 1)) / interval) * interval;
        return df.format(new Date(time));
    }

    /**
     * @param taskType
     * @param timeKey
     */
    protected boolean weAreFirst(String taskType, String timeKey) throws InterruptedException {
        boolean first = false;

        final ILock hzLock = Hazelcast.getLock(map);

        if (hzLock.tryLock(LOCK_TIMEOUT, TimeUnit.MILLISECONDS)) {
            try {
                Deque deque = (Deque) map.get(taskType);

                if (deque == null) deque = new ArrayDeque();
                LOG.debug("Retrieved deque [{} items] from Hazelcast map for task type [{}]", deque.size(), taskType);
                if (!deque.contains(timeKey)) {
                    first = true;
                    deque.offer(timeKey);
                    if (deque.size() > MAX_KEYS) {
                        deque.poll();
                    }
                    map.put(taskType, deque);
                    LOG.debug("Added TimeKey [{}] which is not present in deque.", timeKey);
                }
            } finally {
                hzLock.unlock();
            }
        }

        LOG.debug(String.format("Checking if we are responsible for handling scheduled task. " +
                "TaskType: %s, TimeKey: %s, First: %s", taskType, timeKey, first));

        return first;
    }
}
