const name = 'purgeDataProcess';
const { LOG_GROUP, NODE_ENV } = require('../../config');
const debug = require('debug')(`job ${LOG_GROUP} ${process.pid} ${name}`);
const error = require('debug')(`job ${LOG_GROUP} ${process.pid} ERROR `);

module.exports = {
    process: async function () {
        const db = await require('../../helpers/db')()
        return new Promise(async resolve => {
            const crono = await require('../../helpers/heroku')();

            debug('vw_pg_database_size')
            const size = await db.public['vw_pg_database_size'].findOne();
            size.total_size_bytes = parseInt(size.total_size_bytes);
            console.log(JSON.stringify(size));

            debug('vw_pg_tables_rows')
            const row = await db.public['vw_pg_tables_rows'].findOne();
            row.total_rows = parseInt(row.total_rows);
            console.log(JSON.stringify(row));

            debug('vw_pg_tables_size_top_10')
            for (const item of await db.public['vw_pg_tables_size_top_10'].find()) {
                console.log(JSON.stringify(item));
            }

            debug('sp_purge_data_log ...')
            await db.schema.sp_purge_data_log();

            await crono.postTurnOff()
            resolve();
        }).finally(() => {
            console.log(NODE_ENV)
            if (NODE_ENV === 'development') {
                process.exit(0);
            }
        });
    },
};
