//console.log('index.js');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const config = require('./config');

let workers = argv['workers'] || parseInt(process.env.WORKER_CONCURRENCY) || 1;
const throng = require('throng');

throng({
    master,
    worker,
    count: workers,
});

const pid = process.pid;
const error = require('debug')(`job ${pid} ERROR `);
// This will only be called once
function master() {
    //console.log(`master pid: ${process.pid}`);

    process.once('beforeExit', () => {
        console.log('Master cleanup.');
    });
}

// This will be called four times
function worker(id, disconnect) {
    //console.log(`Started worker id: ${id} pid: ${process.pid}`);
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);

    process.removeAllListeners('uncaughtException');
    process.once('uncaughtException', (err, origin) => {
        error(`>>> ERR >>> uncaughtException ${err}`);
        //error(err);
        //error(`>>> ERR >>> uncaughtException`);
        process.exit(1);
    });

    process.removeAllListeners('unhandledRejection');
    process.once('unhandledRejection', (reason, promise) => {
        error(`>>> ERR >>> unhandledRejection ${reason}`);
        //error(reason);
        // error(`>>> ERR >>> unhandledRejection`);
        process.exit(1);
    });

    process.removeAllListeners('uncaughtExceptionMonitor');
    process.once('uncaughtExceptionMonitor', (err, origin) => {
        error(`>>> ERR >>> uncaughtExceptionMonitor ${err}`);
        //error(err);
        // error(`>>> ERR >>> uncaughtExceptionMonitor`);
        process.exit(1);
    });

    function shutdown() {
        console.log(`Worker ${id} cleanup.`);
        disconnect();
    }

    if (!argv.type) {
        console.log(pid, 'no arguments!');
        process.kill(pid, 'SIGTERM');
    } else {
        const filePath = `./lib/${argv.type}/${argv.process}`;
        console.log(`worker id: ${id} pid: ${process.pid} file: ${filePath}`);

        require(filePath).process();
    }
}
