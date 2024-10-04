const debug = require('debug')(`job ${process.pid} process hello`);
const util = require('../../helpers/util');

module.exports = {
    process: async function () {
        debug("before world!");
        await util.sleep(15000);
        debug("after world!");
    }
}