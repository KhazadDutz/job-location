const { name } = require('../package.json');
const PgBoss = require('pg-boss');

const { DATABASE_URL, CH_TENANT_ID, QUEUE_NAME, PUBSUB_MAX_CONNECTIONS, NODE_ENV, POST_MESSAGE, LOG_GROUP } = require('../config');
const debug = require('debug')(`job ${LOG_GROUP} ${process.pid} pubsub`);
const error = require('debug')(`job ${LOG_GROUP} ${process.pid} ERROR `);
let _boss = null;

module.exports = async (processName = 'pubsub', maxConnections = PUBSUB_MAX_CONNECTIONS) => {
    //public
    const close = async () => {
        return new Promise(async resolve => {
            //debug(`closing...`);
            _boss.stop({ graceful: true });
            debug(`closed.`);

            resolve();
        });
    };

    //public
    const postMessage = async (payload, options = {}, metadata = {}) => {
        return new Promise(async resolve => {
            const { data, externalIdValue } = payload;
            let jobId;

            if (POST_MESSAGE) {
                jobId = await _boss.publish(
                    QUEUE_NAME,
                    {
                        ...data,
                        metadata,
                    },
                    {
                        priority: 10, //Higher numbers have, um, higher priority
                        retryLimit: 1, //Default: 0. Max number of retries of failed jobs. Default is no retries.
                        retryDelay: 2, //Default: 0. Delay between retries of failed jobs, in seconds.
                        retentionDays: 1,
                        ...options,
                    },
                );
            } else {
                jobId = '_FAKE_ID_';
            }

            debug(`publish [${QUEUE_NAME}] message [${jobId.substr(0, 8)}] ${data.schema.objectName} ${externalIdValue}`);

            resolve(jobId);
        });
    };

    //public
    const removeSchedules = async () => {
        return new Promise(async resolve => {
            const schedules = await _boss.getSchedules();
            for (const { name, cron } of schedules) {
                await _boss.unschedule(name);
                debug(`unschedule [${name}] ${cron}`);
            }

            resolve();
        });
    };

    //public
    const listSchedules = async () => {
        return new Promise(async resolve => {
            const schedules = await _boss.getSchedules();
            for (const { name, cron } of schedules) {
                debug(`schedule [${name}] ${cron}`);
            }

            resolve();
        });
    };

    //public default
    return new Promise(async (resolve, reject) => {
        if (!_boss) {
            //debug(`starting...`);
            _boss = new PgBoss({
                connectionString: DATABASE_URL,
                ssl: { rejectUnauthorized: false },
                max: maxConnections,
                retentionDays: 7,
                application_name: `${NODE_ENV}|${CH_TENANT_ID}|${name}_${processName}|pid_${process.pid}`,
                schema: CH_TENANT_ID,
                //noScheduling: true
            });

            //_boss.on('error', error => console.error(error));
            //_boss.on('monitor-states', stats => debug('monitor-states >> ', stats));
            //_boss.on('wip', stats => debug('wip >> ', stats));

            await _boss.start();
            debug(`started.`);
        }

        // injeta os metodos publicos no objeto de saida
        resolve({
            ..._boss,
            close,
            postMessage,
            removeSchedules,
            listSchedules,
        });
    }).catch(err => {
        error(`>>> job ERR >>> ${err}`);
    });
};
