const debug = require('debug')(`job ${process.pid}`);

module.exports = {
    process: async function () {
        return new Promise(async resolve => {
            const types = ['custom'];

            for await (const name of types) {
                const db = await require('../../helpers/db')(name);
                await db.migrationUp();
                await db.close();
            }

            resolve();
        });
    },
};
