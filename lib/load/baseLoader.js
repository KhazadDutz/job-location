const async = require('async');
const { QUEUE_LOAD_CONCURRENCY, CH_TENANT_ID } = require('../../config');

const processFull = async (name, viewOrTableName, filter = {}, options = {}, transformFunc = null, closeAll = true) => {
    const debug = require('debug')(`job ${process.pid} load ${name}`);
    const job = await require('../../helpers/job')(name);
    const db = await require('../../helpers/db')();

    return new Promise(async resolve => {
        // cria a fila interna para transformacao da informacao
        const q = async.queue(async task => {
            return new Promise(async resolve => {
                if (transformFunc) {
                    const data = await transformFunc(task);
                    if (data) {
                        await job.postMessage(
                            data,
                            {
                                priority: 100, //Higher numbers have, um, higher priority
                            },
                            {
                                ignore_hash: false,
                                hash_row: data['hashRow'],
                            },
                        );
                    }
                    resolve();
                }

                resolve();
            });
        }, QUEUE_LOAD_CONCURRENCY);

        q.error(err => {
            console.error(err);
            resolve();
        });

        // sinaliza quando todos os itens foram processados
        q.drain(() => {
            resolve();
        });

        // inicia a transformacao
       
        db.eventEmmiter.addListener(`db::findStream::${viewOrTableName}::readable`, async payload => {
            q.push(payload);
            //console.log(payload);
            const { items } = payload;
            if (items) {
                await items.map(payload => {
                   // console.log(payload);
                    q.push(payload);
                });
            }
        });

        // busca as informacoes para transformacao
        const filterComplete = {
            ...filter,
        };
        debug(`${viewOrTableName} ...`);
        const totalRows = await db.count(viewOrTableName, filterComplete);

        debug(`${viewOrTableName} [${totalRows}] rows`);
        if ((await db.findStream(viewOrTableName, filterComplete, options)) === false) {
            resolve();
        }
    }).finally(async () => {
        // concluída (realizada ou rejeitada)
        if (closeAll) {
            return Promise.all([db.close(), job.close()]);
        }
    });
};

module.exports = {
    processFull,
};
