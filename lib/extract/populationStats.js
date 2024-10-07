const api = require('../../helpers/api')();

const { LOG_GROUP } = require('../../config');
const debug = require('debug')(`job ${LOG_GROUP} ${process.pid}`);
module.exports = {
    process: async function (closeAll = true) {
        const base = await require('./baseExtract')();
        const db = await require('../../helpers/db')();

        return new Promise(async resolve => {
            // const data = await api.getPopulation();
            // console.log(data, 'DATA');
            await base.saveAll(await api.getPopulation());

            resolve();
        }).finally(async () => {
            // concluída (realizada ou rejeitada)
            if (closeAll) {
                await db.close();
            }
        });
    },
};
