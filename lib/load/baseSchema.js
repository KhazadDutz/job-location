const util = require('./util');

module.exports = async data => {
    return new Promise(async resolve => {
        //const debug = require('debug')(`job ${process.pid} load ${data['object_name']}`);
        //console.log(data);

        const objectName = data['sf_object_name'];
        const externalId = data['sf_external_id_field'];
        const externalIdValue = data['sf_external_id_value'];

        const output = {
            schema: {
                objectName,
                externalId,
            },
            value: util.transformProp(data),
            config: {
                columnsUpsert: { ...data['config_columns_upsert'] },
                methodType: data['config_method_type'] ?? 'REST_API',
            },
        };

        //console.log(output);

        resolve({
            data: output,
            hashRow: data['hash_row'],
            externalIdValue,
        });
    });
};
