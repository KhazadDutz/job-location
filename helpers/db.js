const { name } = require('../package.json');
const massive = require('massive');
const monitor = require('pg-monitor');
const events = require('events');

const { CH_TENANT_ID, DATABASE_URL, SHOW_PG_MONITOR, NODE_ENV, PG_MAX_CONNECTIONS, SF_RECORD_TYPE_EVENT, DATA_TEAM_CODE, TIME_ZONE, LOG_GROUP, CUSTOM_CODE, SF_RECORD_TYPE_TEAM_HOME, SF_RECORD_TYPE_TEAM_OPPONENT, DATETIME_FORMAT } = require('../config');
const debug = require('debug')(`job ${LOG_GROUP} ${process.pid} db`);
const error = require('debug')(`job ${LOG_GROUP} ${process.pid} ERROR `);
//console.log(CH_TENANT_ID);

module.exports = async (mode = 'default') => {
    let _dbInstance = null;
    const eventEmmiter = new events.EventEmitter();

    const _emitEvents = async (eventName, eventType, payload) => {
        return new Promise(async resolve => {
            // for (let index = 0; index < 15; index++) {
            //     events.emit(`db::${eventName}::${eventType}`, payload);
            // }
            //console.log(`db::${eventName}::${eventType}`);
            eventEmmiter.emit(`db::${eventName}::${eventType}`, payload);

            resolve();
        });
    };

    const _execFileSql = async (schema, type) => {
        return new Promise(async resolve => {
            if (_dbInstance['schema']) {
                const objects = _dbInstance['schema'][type];
                const name = mode !== 'default' ? CUSTOM_CODE : mode;

                if (objects) {
                    for (const [key, func] of Object.entries(objects)) {
                        debug(`executing ${schema} [${name}] => ${type} ${key}...`);
                        await func({
                            schema: CH_TENANT_ID,
                            DATA_TEAM_CODE,
                            TIME_ZONE,
                            DATETIME_FORMAT,
                            SF_RECORD_TYPE_EVENT,
                            SF_RECORD_TYPE_TEAM_HOME,
                            SF_RECORD_TYPE_TEAM_OPPONENT,
                        });

                        // const customFunc = func[DATA_TEAM_CODE];
                        // if (customFunc) {
                        //     debug(`executing ${schema} ${type} ${key} custom [${DATA_TEAM_CODE}]...`);
                        //     await customFunc({
                        //         schema: CH_TENANT_ID,
                        //         DATA_TEAM_CODE,
                        //         TIME_ZONE,
                        //     });
                        // }
                    }
                }
            }

            resolve();
        });
    };

    //public
    const migrationUp = async () => {
        return new Promise(async resolve => {
            await _execFileSql(CH_TENANT_ID, 'schema');

            //cria as estruturas necessarias no db (schema)
            await _execFileSql(CH_TENANT_ID, 'table');
            await _execFileSql(CH_TENANT_ID, 'function');

            //popula com dados as tabelas necessarias no db (data)
            await _execFileSql(CH_TENANT_ID, 'data');

            //cria a estrutura de views
            await _execFileSql(CH_TENANT_ID, 'view/ref');
            await _execFileSql(CH_TENANT_ID, 'view/sf');
            await _execFileSql(CH_TENANT_ID, 'procedure');

            //indexação
            await _execFileSql(CH_TENANT_ID, 'index');

            //debug(`reload schemas ...`)
            //await _dbInstance.reload();

            resolve();
        });
    };

    //public
    const migrationUpItem = async objectType => {
        return new Promise(async resolve => {
            await _execFileSql(CH_TENANT_ID, objectType);
            resolve();
        });
    };

    //public
    const close = async () => {
        return new Promise(async resolve => {
            //debug(`closing...`);
            await _dbInstance.pgp.end();
            debug(`closed.`);

            resolve();
        });
    };

    //public
    const upsert = async (tableName, id, payload) => {
        return new Promise(async resolve => {
            const r = await _dbInstance[CH_TENANT_ID][tableName].insert(
                {
                    ...payload,
                    id,
                    created_at: 'NOW()',
                    updated_at: 'NOW()',
                },
                {
                    only: true,
                    deepInsert: false,
                    onConflict: {
                        target: 'id',
                        action: 'update',
                        exclude: ['created_at'],
                    },
                },
            );

            //debug(`save [api_data] id: ${id}`);

            resolve(r);
        });
    };

    //public
    const upsertMany = async (tableName, payloads) => {
        const config = {
            only: true,
            deepInsert: false,
            onConflict: {
                target: 'id',
                action: 'update',
                exclude: ['created_at'],
            },
        };

        return new Promise(async resolve => {
            const rowsToDbDuplicated = [];

            const rowsToDb = payloads
                .map((item, index, arr) => {
                    const arrayIds = arr.filter(i => i.id === item.id); // retorna array com ids duplicados

                    const row = {
                        ...item.payload,
                        id: item.id,
                        created_at: 'NOW()',
                        updated_at: 'NOW()',
                    };

                    if (arrayIds.length > 1) {
                        // separa os ids duplicados
                        rowsToDbDuplicated.push({ ...row });
                        return null;
                    }

                    return { ...row };
                })
                .filter(item => item !== null); // remove os itens nulos do array

            // upsert em massa por ids unicos
            await _dbInstance[CH_TENANT_ID][tableName].insert(rowsToDb, config);

            for (const row of rowsToDbDuplicated) {
                // upsert simples dos ids duplicados/sem unicidade
                await _dbInstance[CH_TENANT_ID][tableName].insert(row, config);
            }

            return resolve();
        });
    };

    //public
    const findStream = async (objectName, filter = {}, options = {}) => {
        //console.log(objectName, filter, options)

        let hasRows = false;
        return new Promise(async resolve => {
            //debug(`begin [${objectName}] streaming from DB...`);

            const stream = await _dbInstance[CH_TENANT_ID][objectName].find(filter, {
                ...options,
                stream: true,
            });

            if (stream) {
                stream.on('readable', async () => {
                    while ((row = stream.read()) != null) {
                        hasRows = true;
                        _emitEvents(`findStream::${objectName}`, 'readable', row);
                    }
                });

                stream.on('end', () => {
                    //debug(`end [${objectName}] streaming from DB. hasRows: ${hasRows}`);
                    _emitEvents(`findStream::${objectName}`, 'end', null);

                    resolve(hasRows);
                });
            } else {
                resolve(hasRows);
            }
        });
    };

    //public
    const count = async (objectName, filter = {}) => {
        //console.log(objectName, filter, options)

        return new Promise(async resolve => {
            //debug(`begin [${objectName}] streaming from DB...`);

            const total = await _dbInstance[CH_TENANT_ID][objectName].count(filter);
            resolve(total);
        });
    };

    //public default
    return new Promise(async (resolve, reject) => {
        if (!_dbInstance || mode != 'default') {
            //debug(`starting...`);
            _dbInstance = await massive(
                {
                    connectionString: DATABASE_URL,
                    ssl: { rejectUnauthorized: false },
                    max: PG_MAX_CONNECTIONS,
                    application_name: `${NODE_ENV}|${name}_${CH_TENANT_ID}_db_pid_${process.pid}`,
                },
                {
                    // Massive Configuration
                    scripts: process.cwd() + (mode === 'default' ? '/sql' : `/custom/${CUSTOM_CODE}/sql`),
                    allowedSchemas: [CH_TENANT_ID],
                    whitelist: [`${CH_TENANT_ID}.api_%`, `${CH_TENANT_ID}.vw_%`, `${CH_TENANT_ID}.__%`, `vw_pg_%`],
                    excludeFunctions: false,
                },
                {
                    // Driver Configuration
                    noWarnings: true,
                    error: function (err, client) {
                        error(`>>> db ERR >>> ${err}`);
                        //process.emit('uncaughtException', err);
                        //throw err;
                    },
                },
            );

            if (!monitor.isAttached() && SHOW_PG_MONITOR === 'true') {
                monitor.attach(_dbInstance.driverConfig);
            }
            debug(`started.`);
        }

        // injeta os metodos publicos no objeto de saida
        resolve({
            ..._dbInstance[CH_TENANT_ID],
            schema: _dbInstance[CH_TENANT_ID],
            public: _dbInstance,
            scripts: _dbInstance['schema'] === undefined ? {} : _dbInstance['schema']['scripts'],
            migrationUp,
            migrationUpItem,
            upsert,
            upsertMany,
            close,
            findStream,
            eventEmmiter,
            count,
        });
    }).catch(err => {
        error(`>>> db ERR >>> ${err}`);
    });
};
