module.exports = {
    process: async function () {
        return new Promise(async resolve => {
            const crono = await require('../../helpers/heroku')();

            const processMap = [
                { extract: 'populationStats', load: ['population'] },
                // { extract: 'tournamentCalendarsOT2', load: [] }, //ok
                // { extract: 'teamTM1', load: ['team', 'league'] }, //ok
                // { extract: 'teamStandingsTM2', load: ['standing'] }, //ok
                // { extract: 'playerCareerPE2', load: ['player', 'playerSeason', 'playerLeague'] }, //ok
                // { extract: 'tournamentScheduleMA0', load: [] },
                // { extract: 'matchMA1', load: ['event'] }, //ok
                // { extract: 'matchStatsMA2', load: ['playerStats', 'eventStats', 'gameLineUp'] }, //ok
                //{ extract: 'commentaryMA6', load: ['gameCommentary'] },
                //*evitar push notification para os usuarios* { extract: 'matchStatsMA2', load: ['gameActionSubs', 'gameActionCard', 'gameActionGoal'] },
            ];

            const handler = async (extractName, loadProcesses) => {
                const extract = require(`../extract/${extractName}`);

                return new Promise(async resolve => {
                    await extract.process(false); // recupera as informacoes do provider

                    for (const loadName of loadProcesses) {
                        const load = require(`../load/${loadName}`);
                        await load.process(false); // envia as informacoes para o Salesforce
                    }

                    resolve();
                });
            };

            for (const { extract, load } of processMap) {
                await handler(extract, load);
            }

            await crono.postTurnOff();

            resolve();
        });
    },
};
