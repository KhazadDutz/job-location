const debug = require('debug')(`job ${process.pid}`);

module.exports = {
    process: async function () {
        return new Promise(async resolve => {
            const db = await require('../../helpers/db')('default');          
            const dbCustom = await require('../../helpers/db')('custom');

            const objectTypes = [
                /* Cria as estruturas necessarias no db */
                ,'schema'
                ,'function'
                ,'table'
                /* Popula com dados as tabelas necessarias no db */
                ,'data'
                /* Cria as views */
                ,'view'
                ,'view/ref'
                ,'view/sf'
                /* Cria Indexes */
                ,'index'
                ,'procedure'
            ]

            //default
            for await (const item of objectTypes) {
                await db.migrationUpItem(item);
                
                if (item === 'data'){
                    await dbCustom.migrationUpItem(item);
                }
            }

            //custom
            for await (const item of objectTypes) {
                await dbCustom.migrationUpItem(item);
            }

            await db.close();
            await dbCustom.close();
            resolve();
        });
    },
};
