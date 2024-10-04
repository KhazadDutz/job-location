const debug = require('debug')(`job ${process.pid} load Player`);
const baseLoader = require('./baseLoader');

const transformData = require(`./baseSchema`);

const { DATA_NATION_NAME } = require('../../config');

module.exports = {
    process: async (closeAll = true) => {
        const actions = ['newed', 'updated'];

        return actions.reduce(async (prevPromise, item, index) => {
            const closeConn = closeAll && actions.length - 1 === index; // ultimo item do array
            await prevPromise;

            return baseLoader.processFull(
                'Population' /* nome do processo */,
                `vw_sf_CountryPopulation__${item}` /* nome da view */,
                {
                    /* filtro */
                    // Nation__c: DATA_NATION_NAME,
                },
                {
                    // limit: 1
                },
                transformData /* funcao para transformacao */,
                closeConn,
            );
        }, Promise.resolve());
    },
};
