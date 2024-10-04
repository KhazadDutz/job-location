// pg.js
const { name } = require('../package.json');
const postgres = require('postgres');
const { NODE_ENV, CH_TENANT_ID, DATABASE_URL, SHOW_PG_MONITOR } = require('../config');

module.exports = postgres(DATABASE_URL, {
    /* options */
    max: 100,
    ssl: { rejectUnauthorized: false },
    onnotice: () => null,
    connection: {
        application_name: `${NODE_ENV}|${name}|${CH_TENANT_ID}|pg|${process.pid}`, // Default application_name
    },
    debug: (SHOW_PG_MONITOR === 'true' ? (connection, query, parameters, paramTypes) => {
        console.log(`conn ${connection} >> query \r\n`, query)
        console.log(`${connection} >> parameters >>`, parameters)
    }: null)
});
