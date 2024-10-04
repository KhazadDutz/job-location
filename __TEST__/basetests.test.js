const api = require('../helpers/api')();
const { DATA_SEASON_YEAR } = require('../config');

let matchId = '';
let teamId = '';
const seasonId = 'a2yu8vfo8wha3vza31s2o8zkk';

let db = [];

// beforeAll(async () => {
//     db = await require('../helpers/db')();  
//     matchId = await db.vw_ref_next_game.find();
//     if (matchId !== '' && !(Array.isArray(matchId) && matchId.length === 0)) {
//         matchId = matchId[0].match_id
//         teamId = await db.vw_ref_team_0.find();
//         teamId = teamId[0].team_id
//     }else{
//         await db.close();
//         db = null
//         matchId = null
//         const crono = await require('../helpers/heroku')();
//         await crono.postTurnOff()
//         setTimeout(() => {}, 50000);
//     }
  
// });

function findValue(obj, value) {
    for (let key in obj) {
        if (obj[key] === value) {
            return true;
        }
        if (typeof obj[key] === 'object') {
            if (findValue(obj[key], value)) {
                return true;
            }
        }
    }
    return false;
}

test('Calls the OPTA API [Checks if the OPTA API is active] and receives a valid TOKEN', async () => {
    let token = await api.getToken();
    expect(token).toBeDefined(); // Checks if the token is defined
    token = [];
});

test('Calls the getCommentaryMA6 API and checks if the result for that match is valid', async () => {
    let commentary = await api.getCommentaryMA6(matchId);
    expect(commentary).toBeTruthy(); // Checks if the API is returning data correctly
    commentary = commentary.data[0];
    expect(commentary.id).toBe(matchId); // Checks if the match has a valid ID (same as provided)
    expect(commentary.matchInfo.date).toBeDefined(); // Checks if the match has a defined date
    expect(commentary.messages[0].message).toBeTruthy(); // Checks if there are comments for this match
    console.log(`[Calls] Last received comment: [${commentary.messages[0].message[0].comment}]`)
    console.log(JSON.stringify(commentary.messages[0]))
    commentary = [];
});

test('Calls the getMatchMA1 API and checks if the result is valid', async () => {
    let match = await api.getMatchMA1(matchId);
    expect(match).toBeTruthy(); // Checks if the API is returning data correctly

    match = match.data[0].match[0];
    expect(match.matchInfo.id).toBe(matchId); // Checks if the match has a valid ID (same as provided)
    expect(match.matchInfo.date).toBeDefined(); // Checks if the match has a defined date
    expect(match.liveData).toBeTruthy(); // Checks if match data is coming
    match = [];
});

test('Calls the getMatchStatsMA2 API and checks if the result is valid', async () => {
    let matchStats = await api.getMatchStatsMA2(matchId);
    expect(matchStats).toBeTruthy(); // Checks if the API is returning data correctly
    expect(matchStats.data[0].liveData.lineUp[0].formationUsed).toBeDefined(); // Checks if the Formation has arrived and informs the value

    let team1 = await db.vw_ref_team.find(
        {
            team_id: matchStats.data[0].liveData.lineUp[0].contestantId
        },
        {
            fields: ['team_name'],
        },
    );

    let team2 = await db.vw_ref_team.find(
        {
            team_id: matchStats.data[0].liveData.lineUp[1].contestantId
        },
        {
            fields: ['team_name'],
        },
    );

    console.log(`[Calls] Team Formation [${team1[0].team_name}]: [${matchStats.data[0].liveData.lineUp[0].formationUsed}]`)
    expect(matchStats.data[0].liveData.lineUp[1].formationUsed).toBeDefined(); // Checks if the Formation has arrived and informs the value
    console.log(`[Calls] Team Formation [${team2[0].team_name}]: [${matchStats.data[0].liveData.lineUp[1].formationUsed}]`)

    team1 = []
    team2 = []

    matchStats = matchStats.data[0].matchInfo;
    expect(matchStats.id).toBe(matchId); // Checks if the match has a valid ID (same as provided)
    expect(matchStats.date).toBeDefined(); // Checks if the match has a defined date
    expect(matchStats.contestant).toBeTruthy(); // Checks if team data is coming
    expect(matchStats.competition).toBeTruthy(); // Checks if competition data is coming
    matchStats = [];
});

test('Calls the getPlayerCareerPE2 API and checks if the result is valid', async () => {
    const playerCareer = await api.getPlayerCareerPE2(teamId);
    expect(playerCareer).toBeTruthy(); // Checks if the API is returning player data for the selected team
});

test('Calls the getTeamStandingsTM2 API and checks if the result is valid', async () => {
    let standings = await api.getTeamStandingsTM2(seasonId);
    expect(standings).toBeTruthy(); // Checks if the API is returning the correct standings

    standings = standings.data[0];
    expect(standings.id).toBe(seasonId); // Checks if the standing has a valid ID (same as provided)
    expect(standings.competition).toBeTruthy(); // Checks if competition data is coming valid
    expect(standings.tournamentCalendar).toBeTruthy(); // Checks if competition calendar data is valid
    expect(standings.stage[0]).toBeTruthy(); // Checks if stage data is coming correctly
    standings = [];
});

test('Calls the getTeamTM1 API and checks if the result is valid', async () => {
    const teams = await api.getTeamTM1(seasonId);
    console.log(JSON.stringify(teams))
    expect(teams).toBeTruthy(); // Checks if the API is returning the teams correctly
    expect(Object.keys(teams.data).length).toBe(20); // Checks if the correct number of teams is coming
});

test('Calls the tournamentCalendar API and checks if the result is valid', async () => {
    const tournamentCalendar = await api.getTournamentCalendarsOT2(DATA_SEASON_YEAR);
    expect(tournamentCalendar).toBeTruthy(); // Checks if the API is returning the tournaments the team is participating in
    expect(findValue(tournamentCalendar, 'Serie A')).toBe(true); // Checks if 'Serie A' is present in the tournament calendar
});

test('Calls the tournamentScheduleMA0 API and checks if the result is valid', async () => {
    let tournamentSchedule = await api.getTournamentScheduleMA0(seasonId);
    expect(tournamentSchedule).toBeTruthy(); // Checks if the API is returning the tournament matches
    tournamentSchedule = tournamentSchedule.data[0];
    expect(tournamentSchedule.id).toBe(seasonId); // Checks if the tournament has a valid ID (same as provided)
    expect(tournamentSchedule.competition).toBeTruthy(); // Checks if competition data is coming valid
    expect(tournamentSchedule.tournamentCalendar).toBeTruthy(); // Checks if competition calendar data is valid
    expect(tournamentSchedule.matchDate).toBeTruthy(); // Checks if match data is coming
    tournamentSchedule = [];
});

test('TURN OFF', async () => {
    const crono = await require('../helpers/heroku')();
    console.log(await crono.postTurnOff())
});
