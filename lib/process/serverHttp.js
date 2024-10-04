const express = require('express');
const util = require('../../helpers/util');

const { PORT, LOG_GROUP } = require('../../config');
const debug = require('debug')(`job ${LOG_GROUP} ${process.pid} server`);
const queueName = 'queue_http_request';

const options = {
    priority: 100, //Higher numbers have, um, higher priority
    retryLimit: 0, //Default: 0. Max number of retries of failed jobs. Default is no retries.
    retryDelay: 0, //Default: 0. Delay between retries of failed jobs, in seconds.
    retentionDays: 1,
};

//const job = await require('../../helpers/job')();
//let job = null;

//process/?extract=team,player,league&load=team,player,playerLeague,playerSeason,league
//process/team
//process/player
//process/league

//process/?extract=event&load=event
//process/event

//extract/?extract=commentary&load=commentary
//process/commentary

//extract/team
//extract/player
//extract/league

//extract/commentary
//extract/event

//load
//load/commentary
//load/event

//load/team
//load/player
//load/playerLeague
//load/playerSeason
//load/league

module.exports = {
    process: async function () {
        //const job = await require('../../helpers/job')();
        const app = express();

        app.get('/', function (req, res) {
            res.send('Hello World');
        });

        // app.get('/job/start', async (req, res) => {
        //     const data = {
        //         extract: ['team', 'player', 'league'],
        //         load: ['team', 'player', 'playerLeague', 'playerSeason', 'league']
        //     };
        //     //console.log(job)
        //     const jobId = await job.publish(queueName, data, {
        //         ... options,
        //         singletonKey: req.params
        //     });
        //     console.log(jobId)

        //     if (jobId){
        //         debug(`publish [${queueName}] message [${jobId}] ${req.params}`);
        //     }

        //     res.json({jobId})
        // })

        // app.post('/job/list', function (req, res) {
        //     res.send('Hello World')
        // })

        // app.get('/job/:id', async (req, res) => {
        //     var id = req.params.id;
        //     const jobInfo = await job.getJobById(id);

        //     //console.log(id);
        //     res.json(jobInfo);
        // })

        debug(`starting...'`);
        app.listen(PORT);
        debug(`started.'`);

        debug(`listening http [${PORT}]...'`);
    },
};
