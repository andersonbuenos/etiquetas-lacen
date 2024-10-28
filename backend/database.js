const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados: ' + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS etiquetas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_serie TEXT UNIQUE,
            data_impressao DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Erro ao inserir etiqueta no banco de dados: ' + err.message);
            } else {
                console.log('Tabela de etiquetas criada com sucesso!');
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS configuracoes (
            id INTEGER PRIMARY KEY,
            capacidade_rolo INTEGER,
            ultimo_numero_serie INTEGER
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar tabela de configurações: ' + err.message);
            } else {
                console.log('Tabela de configurações criada com sucesso!');
                // Insere um registro inicial se a tabela estiver vazia
                db.get(`SELECT COUNT(*) as count FROM configuracoes`, [], (err, row) => {
                    if (row.count === 0) {
                        db.run(`INSERT INTO configuracoes (id, capacidade_rolo, ultimo_numero_serie) VALUES (1, 900, 0)`, (err) => {
                            if (err) {
                                console.error('Erro ao inserir configuração padrão: ' + err.message);
                            } else {
                                console.log('Configuração padrão inserida com sucesso!');
                            }
                        });
                    }
                });
            }
        });
    }
});

module.exports = db;
