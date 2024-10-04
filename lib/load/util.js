const util = require('../../helpers/util');

const transformProp = data => {
    const keys = Object.keys(data);
    const obj = {};

    for (const name of keys) {
        const field = name.split('|');
        const fieldName = field[0];
        const fieldType = field[1];

        if (fieldType && data[name] !== '_ignore_') {
            if (fieldType === 'Date') {
                obj[fieldName] = util.getValueNull(data[name]);
            } else if (fieldType === 'Checkbox') {
                obj[fieldName] = util.getBoolValue(data[name]);
            } else if (fieldType === 'LongText') {
                obj[fieldName] = util.getValueNull(data[name], len=100000);
            } else if (fieldType === 'Number' || fieldType === 'Currency') {
                obj[fieldName] = util.getNumberValue(data[name]);
            } else if (fieldType === 'Lookup') {
                const fieldNameRef = field[2];
                if (data[name] !== null) {
                    obj[fieldName] = {
                        [fieldNameRef]: util.getValueNull(data[name]),
                    };
                }
            } else {
                obj[fieldName] = util.getValueNull(data[name]);
            }
        }

        //debug(`${fieldName} ${fieldType} [${data[name]}]`);
    }
    return obj;
};

module.exports = {
    transformProp,
};
