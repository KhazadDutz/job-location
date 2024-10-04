module.exports = {
    sleep: function funcaoUm(ms = 0) {
        return new Promise(r => setTimeout(r, ms));
    },
    asyncForEach: async function (array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },
    getValue: function (obj, len = 255) {
        if (typeof obj === 'number') {
            return obj;
        }

        return [obj].join('').substr(0, len);
    },
    getValueNull: function (obj, len = 255) {
        if (typeof obj === 'number') {
            return obj;
        }

        if (obj) {
            return [obj].join('').substr(0, len);
        } else {
            return null;
        }
    },
    getNumberValue: function (obj) {
        if (typeof obj === 'number' && !isNaN(obj)) {
            return obj;
        }

        if (obj) {
            const r = parseFloat([obj].join(''));
            return isNaN(r) ? 0 : r;
        } else {
            return 0;
        }
    },
    getBoolValueNull: function (obj) {
        if (obj) {
            return obj === 'Y' ? true : false;
        } else {
            return null;
        }
    },
    getBoolValue: function (obj) {
        if (obj) {
            return obj === 'Y' || obj === '1' || obj === 'true' || obj === true ? true : false;
        }

        return false;
    },
    getMemoryUsage: () => {
        const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
    
        const memoryData = process.memoryUsage();
    
        const memoryUsage = {
        rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
        heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
        heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
        external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
        };
    
        return memoryUsage;
    },
}