const debug = require('debug')(`job ${process.pid} sub`);
const hash = require('object-hash');

//const { EVENT_QUEUE_NAME } = require('../../config');

const options = {
    newJobCheckInterval: 150,
    batchSize: 1,
    //includeMetadata: true
};

module.exports = {
    process: async function () {
        const job = await require('../../helpers/job')('eventProcess');
        const db = await require('../../helpers/db')();
        const api = require('../../helpers/api')();
        const EVENT_QUEUE_NAME = 'listen_data';

        const jobHandler = async jobs => {
            const size = await job.getQueueSize(EVENT_QUEUE_NAME);

            const pendingToDone = [];
            const pendingToSave = jobs.map((item, index) => {
                const { value, config, metadata } = item.data;
                const id = value['Id'];
                const docName = value['attributes']['type'];
                const objectName = config.object_name;

                pendingToDone.push({
                    jobId: item.id,
                    id,
                    objectName,
                    done: item.done,
                });

                return {
                    id,
                    payload: {
                        doc_name: docName,
                        doc_id: id,
                        doc_record: value,
                        doc_meta_data: {
                            config,
                            metadata,
                        },
                        doc_record_hash: hash(value),
                        status: 'pending',
                        msg_error: null,
                    },
                };
            });
            
            if (pendingToSave[0].payload.doc_record) {
                await db.upsertMany('api_data', pendingToSave);
            }

            pendingToDone.map(({ jobId, id, objectName, done }, index) => {
                debug(`${index} job [${jobId.substr(0, 8)}] ${objectName} ${id} [OK] len: ${size}`);
                done(); // executa o done do callback
            });
        };

        const size = await job.getQueueSize(EVENT_QUEUE_NAME);
        debug(`[${EVENT_QUEUE_NAME}] ${size} pending ...`);

        await job.subscribe(EVENT_QUEUE_NAME, options, jobHandler);
        debug(`[${EVENT_QUEUE_NAME}] listening ...`);
    },
};
