const { LOG_GROUP } = require('../../config');
const debug = require('debug')(`job ${process.pid}`);
const error = require('debug')(`job ${LOG_GROUP} ${process.pid} ERROR `);
const async = require('async');

module.exports = async () => {
    const db = await require('../../helpers/db')();

    const save = async payload => {
        return new Promise(async resolve => {
            //console.log(payload);

            const { type, url, item } = payload;
            const id = `${type}::${item['id']}`;

            await db.upsert('api_data', id, {
                doc_name: type,
                doc_id: item['id'],
                doc_record: item,
                doc_meta_data: {
                    url,
                },
            });

            resolve(true);
        });
    };

    const saveAll = async payload => {
        return new Promise(async resolve => {
            if (!payload) {
                return resolve(true);
            }

            const { type, url, data } = payload;

            // cria a fila interna para persistencia da informacao
            const q = async.queue(async payload => {
                //console.log(payload)
                return await save(payload);
            }, 25);

            q.error(err => {
                error(`>>> baseExtract ERR >>> ${err}`);
                resolve(false);
            });

            // sinaliza quando todos os itens foram processados
            q.drain(() => {
                resolve(true);
            });

            for (const item of data) {
                // publica na fila interna o payload
                q.push({ type, url, item });
            }

            if (data.length === 0 && q.length() === 0) {
                resolve(true);
            }
        });
    };

    //public default
    return new Promise(async resolve => {
        // injeta os metodos publicos no objeto de saida
        resolve({
            saveAll,
        });
    }).catch(err => {
        error(`>>> baseExtract ERR >>> ${err}`);
    });
};
