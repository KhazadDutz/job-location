const debug = require('debug')(`job ${process.pid} api`);
const error = require('debug')(`job ${process.pid} ERROR `);
const axios = require('axios');
const util = require('../helpers/util');

const { API_JOB_CRONOS, HEROKU_APP_NAME, DYNO, CRONOS_MAX_RETRY, CRONOS_TIME_BREAK, API_MAX_RETRY, } = require('../config');

class Crono {

    async fn_retry(retry, resolve) {
         if (CRONOS_MAX_RETRY > retry) {
            /* SLLEPING */
            const wait = CRONOS_TIME_BREAK * retry;
            debug(`retry turnoff [${retry}] wating ${wait}ms `);
            await util.sleep(wait);

            /* RUM */
            this.postTurnOff(++retry);
        } else {
            debug(`retry turnoff [${retry}] >> Limite de ${retry} tentativas excedidas!`);
            error(`retry turnoff [${retry}] >> Err => ${err}`);
            resolve(err);
        }
    }

    async postTurnOff(retry = 1) {
        return new Promise(async (resolve) => {
            try {
                const queryString = await this.parseQueryParams([
                    { key: 'appName', value: HEROKU_APP_NAME },
                    { key: 'dynoName', value: DYNO }
                ]);

                const response = await axios.post(`${API_JOB_CRONOS}/job/cron_turn_off?${queryString}`, {
                    cache: 'no-cache',
                    headers: {
                        'Content-Encoding': 'gzip, deflate',
                        'cache-control': 'no-cache, no-store, must-revalidate',
                        'pragma': 'no-cache',
                        'expires': 0,
                    },
                });

                if (response.status === 200) {
                    debug(`post job-cronos -dyno=${DYNO} postTurnOff enviado`);
                    resolve(response.data);
                } else {
                    debug(`post job-cronos Err: '${response.status}`);
                    await this.fn_retry(retry);
                }

            } catch (err) {
                debug(`post job-cronos >> Err: ${err}! retry [${retry}/${API_MAX_RETRY}]`);
                await this.fn_retry(retry);
            }
        });
    }

    async parseQueryParams(queryParams = []) {
        let params = '';
        queryParams.map(param => {
            params = `${params}&${param.key}=${param.value}`;
        });
        return params;
    }
}

module.exports = () => {
    const instance = new Crono();

    return instance;
}