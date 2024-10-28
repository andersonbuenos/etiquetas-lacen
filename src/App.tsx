import React, { useState } from 'react';
import Etiqueta from './componente/Etiqueta';
import './style.css';

const App: React.FC = () => {
  const [idAmostra] = useState<string>('24' + String(1).padStart(6, '0'));


  return (
    <div className="App">
      <Etiqueta idAmostra={idAmostra} />
      {/*       <button onClick={imprimirEtiqueta}>Imprimir</button> */}
    </div>
  );
};

export default App;
