const { LOG_GROUP } = require('../../config');
const debug = require('debug')(`job ${LOG_GROUP} ${process.pid} sub queueHttp`);
const queueName = 'queue_http_request';
const util = require('../../helpers/util');

const options = {
    newJobCheckInterval: 150,
    batchSize: 1,
    teamSize: 1,
    teamConcurrency: 1,
    //includeMetadata: true
};

module.exports = {
    process: async function () {
        const job = await require('../../helpers/job')();

        await job.subscribe(queueName, options, async jobs => {
            //console.log(jobs);
            jobs.map(async (jobItem, index) => {
                const { id, data } = jobItem;
                debug(`${index} job[${id}]`);

                // const data = {
                //     extract: ['team', 'player', 'league'],
                //     load: ['team', 'player', 'playerLeague', 'playerSeason', 'league']
                // };

                for (const item of data.extract) {
                    debug(`job[${id}] extract ${item}`);
                    await util.sleep(5000);
                    debug(`job[${id}] extract ${item} end!`);
                }

                for (const item of data.load) {
                    debug(`job[${id}] load ${item}`);
                    await util.sleep(5000);
                    debug(`job[${id}] load ${item} end!`);
                }
                // data.extract.map(async item => {

                // });

                jobItem.done();
                debug(`${index} job[${id}] [OK]`);
            });
            //console.log(jobs.map(job => job.data))
        });

        const size = await job.getQueueSize(queueName);
        debug(`[${queueName}] ${size} pending ...'`);

        debug(`[${queueName}] listening ...'`);
    },
};
