const debug = require('debug')(`job ${process.pid} config`);

// dotenv INIT ---------------------------------
const path = require('path');
const pwd = process.env.INIT_CWD || process.env.PWD || '.';
const envType = path.basename(pwd);
const customCode = path.basename(path.join(pwd, '../../'));
const nodeEnv = process.env.NODE_ENV || 'development';

const dotenv = require('dotenv');
dotenv.config(); // default .env root

if (nodeEnv === 'development') {
    // custom .env
    console.log(`>>> file >>>`);
    console.log(`>>> file envType [${envType}]`);
    console.log(`>>> file customCode [${customCode}]`);
    const envFile = path.join('custom', customCode, `envs`, envType, `.${customCode}.env`);

    console.log(`>>> file envFile [${envFile}]`);
    const customEnv = dotenv.config({ path: envFile });
    //console.log(customEnv.parsed);

    // envs obrigatorias
    process.env.CUSTOM_CODE = process.env.CUSTOM_CODE || customCode;
    process.env.LOG_GROUP = process.env.LOG_GROUP || customCode;

    // merge das configuracoes (default + custom)
    process.env = {
        ...process.env,
        ...customEnv.parsed,
    };
}
// dotenv END ---------------------------------

//console.dir(envs.parsed);
try {
    const [herokuPostgreSQLProp] = Object.entries(process.env).find(([chave]) => chave.startsWith('HEROKU_POSTGRESQL')) || [];
    process.env.DATABASE_URL = herokuPostgreSQLProp ? process.env[herokuPostgreSQLProp] : process.env.DATABASE_URL;
} catch (error) {
    throw `ERROR: String de conexão POSTGRESQL deve estar em variável de ambiente, com a variável iniciando com padrão HEROKU_POSTGRESQL. Ex: "HEROKU_POSTGRESQL_AQUA_URL=postgresql://username:password@host:port/dbname[?paramspec]"`;
}

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG || 'job*',
    CUSTOM_CODE: process.env.CUSTOM_CODE || '',
    WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY ? process.env.WORKER_CONCURRENCY : 1),
    CH_TENANT_ID: process.env.CH_TENANT_ID || 'dev',

    QUEUE_NAME: process.env.QUEUE_NAME || 'qu_save_sf',
    QUEUE_LOAD_CONCURRENCY: parseInt(process.env.QUEUE_LOAD_CONCURRENCY ? process.env.QUEUE_LOAD_CONCURRENCY : 50),

    DATABASE_URL: process.env.DATABASE_URL || '',
    SHOW_PG_MONITOR: process.env.SHOW_PG_MONITOR || 'false',
    PORT: parseInt(process.env.PORT ? process.env.PORT : 3000),

    API_TOKEN: process.env.API_TOKEN || '',
    API_URL: process.env.API_URL || 'https://datausa.io/api',
    API_MAX_RETRY: parseInt(process.env.API_MAX_RETRY ? process.env.API_MAX_RETRY : 5),

    DATA_NATION_NAME: process.env.DATA_NATION_NAME || 'United States',
    DATA_SEASON_YEAR: process.env.DATA_SEASON_YEAR || '2021',
    DATA_TEAM_CODE: process.env.DATA_TEAM_CODE || 'ORL',
    LOG_GROUP: process.env.LOG_GROUP || '',

    SF_ORG_PREFIX: process.env.SF_ORG_PREFIX || 'cgny2__',
    SF_EXTERNAL_ID: process.env.SF_EXTERNAL_ID || (process.env.SF_ORG_PREFIX || 'cgny2__') + 'ExternalId__c',

    API_OUTLET_KEY: process.env.API_OUTLET_KEY || '',
    API_SECRET_KEY: process.env.API_SECRET_KEY || '',
    OAUTH_ENDPOINT: process.env.OAUTH_ENDPOINT || 'https://oauth.performgroup.com/oauth/token',

    ORG_SCHEMA_TYPE: process.env.ORG_SCHEMA_TYPE || 'CGNY',

    DATA_PROCESS_CRON: process.env.DATA_PROCESS_CRON || '0/1 * * * *',

    GAMEDAY_PROCESS_QUEUE_NAME: process.env.GAMEDAY_PROCESS_QUEUE_NAME || 'cron_gameday_process',
    GAMEDAY_PROCESS_CRON: process.env.GAMEDAY_PROCESS_CRON || '0/1 * * * *',
    GAMEDAY_PROCESS_INTERVAL_MATCHSTATS_MA2: parseInt(process.env.GAMEDAY_PROCESS_INTERVAL_MATCHSTATS_MA2 || 2 * 1000), // 2s
    GAMEDAY_PROCESS_INTERVAL_COMMENTARY_MA6: parseInt(process.env.GAMEDAY_PROCESS_INTERVAL_COMMENTARY_MA6 || 1000), // 1s
    GAMEDAY_PROCESS_INTERVAL_ENDGAME: parseInt(process.env.GAMEDAY_PROCESS_INTERVAL_ENDGAME || 15 * 60 * 1000), // 15 min
    GAMEDAY_PROCESS_INTERVAL_PLAYER: parseInt(process.env.GAMEDAY_PROCESS_INTERVAL_PLAYER || 5 * 60 * 1000), // 5 min

    DEBUG_HIDE_DATE: JSON.parse((process.env.DEBUG_HIDE_DATE || 'false').toLowerCase()),

    POST_MESSAGE: JSON.parse((process.env.POST_MESSAGE || 'true').toLowerCase()),
    SF_RECORD_TYPE_EVENT: process.env.SF_RECORD_TYPE_EVENT || 'EMPTY',
    PUBSUB_MAX_CONNECTIONS: parseInt(process.env.PUBSUB_MAX_CONNECTIONS ? process.env.PUBSUB_MAX_CONNECTIONS : 1),
    PG_MAX_CONNECTIONS: parseInt(process.env.PG_MAX_CONNECTIONS ? process.env.PG_MAX_CONNECTIONS : 1),

    SF_RECORD_TYPE_TEAM_HOME: process.env.SF_RECORD_TYPE_TEAM_HOME || 'EMPTY',
    SF_RECORD_TYPE_TEAM_OPPONENT: process.env.SF_RECORD_TYPE_TEAM_OPPONENT || 'EMPTY',

    TIME_ZONE: process.env.TIME_ZONE || 'America/New_York',
    DATETIME_FORMAT: process.env.DATETIME_FORMAT || 'MM/DD/YY - hh:mmA',
    LOCALE_CODE: process.env.LOCALE_CODE || 'en-us',

    PAYLOAD_IGNORE_HASH: JSON.parse((process.env.PAYLOAD_IGNORE_HASH || 'false').toLowerCase()),

    API_JOB_CRONOS: process.env.API_JOB_CRONOS || 'https://job-cronos-d740053ee655.herokuapp.com',
    HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || 'job-opta',
    DYNO: process.env.DYNO.split('.')[0] || '',

    CRONOS_MAX_RETRY: process.env.CRONOS_MAX_RETRY || 10,
    CRONOS_TIME_BREAK: process.env.CRONOS_TIME_BREAK || 60000,
};

// const keys = Object.keys(module.exports).sort();
// for (const name of keys) {
//     debug(`${name} [${module.exports[name]}]`);
// }

console.log();
console.log(`>>> env >>>`);
console.log(`>>> env CH_TENANT_ID [${module.exports.CH_TENANT_ID}] `);
console.log(`>>> env CUSTOM_CODE [${module.exports.CUSTOM_CODE}]`);
console.log();
