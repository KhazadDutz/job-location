const api = require('../helpers/api')();

describe('Testar o funcionamento das Credenciais OPTA', () => {
    test('Chama a API OPTA e recebe um TOKEN válido', async () => {
        const token = await api.getToken();
        expect(token).toBeDefined(); // Verifica se o token está definido
    });
});

