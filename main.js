const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const config = require('./config');

const filePath = `./lib/${argv.type}/${argv.process}`;
console.log('main.js >>> file:', filePath);

// const start = async () => {
//   return await require(filePath).process();
// }

// Call start
(async () => {
    console.log('main.js: before start');

    try {
        await require(filePath).process();
    } catch (e) {
        console.error(`>>> ERROR >>> ${e.message}`);
    } finally {
        //console.log('finally');
    }
    console.log('main.js: after start');
})();
