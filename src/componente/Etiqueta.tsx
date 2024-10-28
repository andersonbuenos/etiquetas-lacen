import React, { useEffect, useRef, useState, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import axios from 'axios';
import './Etiqueta.css';

interface EtiquetaProps {
    idAmostra: string;
}

const Etiqueta: React.FC<EtiquetaProps> = () => {
    const barcodeRef = useRef<SVGSVGElement | null>(null);

    const anoAtual = new Date().getFullYear().toString().slice(-2);
    const [numeroSerie, setNumeroSerie] = useState<number>(1);
    const [quantidade, setQuantidade] = useState<number>(1);
    const [etiquetasParaImprimir, setEtiquetasParaImprimir] = useState<string[]>([]);
    const [etiquetasRestantes, setEtiquetasRestantes] = useState<number>(900);
    const [capacidadeRolo, setCapacidadeRolo] = useState<number>(900);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [impressaoConcluida, setImpressaoConcluida] = useState<boolean>(false);

    const gerarIdAmostra = useCallback((serie: number): string => {
        return `${anoAtual}-${String(serie).padStart(6, '0')}`;
    }, [anoAtual]);

    useEffect(() => {
        etiquetasParaImprimir.forEach((etiqueta, index) => {
            const svgElement = document.getElementById(`barcode-${index}`);
            if (svgElement) {
                JsBarcode(svgElement, etiqueta, {
                    format: 'CODE128',
                    displayValue: false,
                    width: 3,
                    height: 70,
                    marginTop: 1,
                });
            }
        });
    }, [etiquetasParaImprimir]);

    const fetchRoloData = async () => {
        try {
            const response = await axios.get('http://localhost:3001/rolos');
            const { capacidade, ultimoNumeroSerie } = response.data;

            setCapacidadeRolo(capacidade);
            setNumeroSerie(ultimoNumeroSerie);
            setEtiquetasRestantes(capacidade);
        } catch (error) {
            console.error('Erro ao buscar dados do rolo:', error);
            alert('Ocorreu um erro ao buscar dados do rolo.');
        }
    };

    useEffect(() => {
        fetchRoloData();
    }, []);

    const saveCapacidadeRolo = async () => {
        try {
            await axios.post('http://localhost:3001/atualizar-capacidade', { novaCapacidade: capacidadeRolo });
            setEtiquetasRestantes(capacidadeRolo);
            setEditMode(false);
            alert('Capacidade do rolo atualizada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar a capacidade do rolo:', error);
            alert('Ocorreu um erro ao atualizar a capacidade do rolo.');
        }
    };

    const handleAfterPrint = () => {
        if (impressaoConcluida) {
            setNumeroSerie(numeroSerie + quantidade);
            const novasRestantes = etiquetasRestantes - quantidade;
            setEtiquetasRestantes(novasRestantes);

            if (novasRestantes <= 10) {
                alert('Atenção: Faltam menos de 10 etiquetas no rolo!');
            }
        } else {
            alert('Impressão cancelada ou não realizada!');
        }
    };

    const handlePrint = async (): Promise<void> => {
        if (quantidade <= 0) {
            alert('Por favor, insira uma quantidade válida.');
            return;
        }

        if (numeroSerie < 1) {
            alert('Número de série inválido.');
            return;
        }

        try {
            const response = await axios.post<{ etiquetas: string[] }>('http://localhost:3001/imprimir', {
                quantidade: quantidade,
                ultimoNumeroSerie: numeroSerie - 1,
            });

            const novasEtiquetas = response.data.etiquetas;
            setEtiquetasParaImprimir(novasEtiquetas);
            setNumeroSerie(numeroSerie + quantidade);

            const novasRestantes = etiquetasRestantes - quantidade;
            setEtiquetasRestantes(novasRestantes);

            if (novasRestantes <= 10) {
                alert('Atenção: Faltam menos de 10 etiquetas no rolo!');
            }

            setTimeout(() => {
                window.print();
            }, 500);
        } catch (error) {
            console.error('Erro ao imprimir etiquetas:', error);
            alert('Ocorreu um erro ao imprimir as etiquetas.');
        }
    };

    return (
        <div className="etiqueta-container">
            <div className="etiqueta-header"></div>
            <div className="etiqueta-content">
                {etiquetasParaImprimir.map((etiqueta, index) => (
                    <div className="etiqueta" key={index} style={{ pageBreakAfter: 'always' }}>
                        <div className="etiqueta-info">
                            <p className="paciente"><strong>Paciente:</strong></p>
                            <p className='idamostra'><strong>ID Amostra:</strong> {etiqueta}</p>
                        </div>
                        <div className="etiqueta-barcode">
                            <svg
                                id={`barcode-${index}`}
                                style={{
                                    width: '5cm',
                                    height: '2cm',
                                    display: 'block',
                                }}
                            ></svg>
                        </div>
                    </div>
                ))}
            </div>
            <div className="print-controls">
                <label htmlFor="quantidade">Qtde de etiquetas:</label>
                <input
                    type="number"
                    id="quantidade"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    min="1"
                />
                <label htmlFor="capacidadeRolo">Capacidade do rolo:</label>
                <input
                    type="number"
                    id="capacidadeRolo"
                    value={capacidadeRolo}
                    onChange={(e) => setCapacidadeRolo(Number(e.target.value))}
                    disabled={!editMode}
                    min="1"
                />
                <button onClick={() => setEditMode(true)}>Editar Capacidade</button>
                <button onClick={saveCapacidadeRolo} disabled={!editMode}>Salvar Capacidade</button>
                <button onClick={handlePrint}>Imprimir</button>
                <p className='ultimaImpressao'><strong>Última Impressão:</strong> {quantidade} Etiqueta{quantidade > 1 ? 's' : ''}</p>
                <p className='ultimaSerie'><strong>Último nº de série impresso:</strong> {gerarIdAmostra(numeroSerie - 1)}</p>
                <p className='totalEtiquetas'><strong>Etiquetas restantes no rolo:</strong> {etiquetasRestantes}</p>
            </div>
        </div>
    );
};

export default Etiqueta;
