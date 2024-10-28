const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const inserirEtiqueta = (numeroSerieFormatado) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO etiquetas (numero_serie) VALUES (?)`, [numeroSerieFormatado], (err) => {
            if (err) {
                console.error('Erro ao inserir etiqueta no banco de dados: ' + err.message);
                return reject(err);
            }
            resolve();
        });
    });
};

app.post('/imprimir', async (req, res) => {
    const { quantidade } = req.body;

    db.get(`SELECT * FROM configuracoes WHERE id = 1`, [], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar configurações.' });
        }

        const ultimoNumeroSerie = row.ultimo_numero_serie;
        const novasEtiquetas = [];
        const promises = [];

        for (let i = 0; i < quantidade; i++) {
            const numeroSerie = ultimoNumeroSerie + i + 1;
            const numeroSerieFormatado = `${new Date().getFullYear().toString().slice(-2)}-${String(numeroSerie).padStart(6, '0')}`;
            novasEtiquetas.push(numeroSerieFormatado);
            promises.push(inserirEtiqueta(numeroSerieFormatado));
        }

        try {
            await Promise.all(promises);
            db.run(`UPDATE configuracoes SET ultimo_numero_serie = ? WHERE id = 1`, [ultimoNumeroSerie + quantidade]);
            res.json({ etiquetas: novasEtiquetas });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao inserir etiquetas no banco de dados.' });
        }
    });
});

app.get('/etiquetas', (req, res) => {
    db.all(`SELECT * FROM etiquetas ORDER BY data_impressao DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar etiquetas.' });
        }
        res.json(rows);
    });
});

app.get('/configuracoes', (req, res) => {
    db.get(`SELECT * FROM configuracoes WHERE id = 1`, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar configurações.' });
        }
        res.json(row);
    });
});

app.post('/atualizar-capacidade', (req, res) => {
    const { novaCapacidade } = req.body;
    db.run(`UPDATE configuracoes SET capacidade_rolo = ? WHERE id = 1`, [novaCapacidade], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar a capacidade do rolo.' });
        }
        res.json({ message: 'Capacidade do rolo atualizada com sucesso!' });
    });
});

app.get('/rolos', (req, res) => {
    db.get(`SELECT capacidade_rolo, ultimo_numero_serie FROM configuracoes WHERE id = 1`, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar dados do rolo.' });
        }
        if (row) {
            const { capacidade_rolo: capacidade, ultimo_numero_serie } = row;
            return res.json({ capacidade, ultimoNumeroSerie: ultimo_numero_serie });
        } else {
            return res.status(404).json({ error: 'Configurações não encontradas.' });
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
