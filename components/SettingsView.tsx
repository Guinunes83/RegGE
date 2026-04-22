
import React, { useState } from 'react';

interface SettingsViewProps {
  currentLogo: string | null;
  currentText: string;
  onConfigUpdate: (logoData: string | null, text: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentLogo, currentText, onConfigUpdate }) => {
  const [preview, setPreview] = useState<string | null>(currentLogo);
  const [textPreview, setTextPreview] = useState<string>(currentText);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setPreview(result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Por favor, selecione apenas arquivos PNG ou JPEG.');
      }
    }
  };

  const handleSave = () => {
    onConfigUpdate(preview, textPreview);
    alert('Configurações salvas com sucesso!');
  };

  const handleReset = () => {
    setPreview(null);
    setTextPreview('GRUPO ELORA');
    onConfigUpdate(null, 'GRUPO ELORA');
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-black text-[#007b63] uppercase tracking-tighter">Configurações do Sistema</h2>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Personalização Visual</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Logo do Painel Principal</label>
          <p className="text-xs text-gray-500 text-justify">
            Selecione uma imagem (.png ou .jpeg) para substituir o logo padrão na tela inicial e no menu lateral. 
            Recomendamos imagens horizontais com fundo transparente. E edite o texto abaixo do logo.
          </p>
          
          <div className="mt-4 flex flex-col gap-4">
            <label className="cursor-pointer bg-[#d1e7e4] text-[#007b63] px-6 py-2 rounded-lg font-bold text-sm text-center border border-[#007b63]/20 hover:bg-[#007b63] hover:text-white transition-colors w-full">
              <span>Selecionar Imagem</span>
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleFileChange}
                className="hidden" 
              />
            </label>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Texto abaixo da logo</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#007b63]"
                value={textPreview}
                onChange={(e) => setTextPreview(e.target.value)}
                placeholder="Ex: Grupo Elora, Meu Sistema..."
              />
            </div>
            
            <button 
              onClick={handleSave}
              className="bg-[#007b63] text-white px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-[#00604d] transition-colors w-full mt-2"
            >
              OK (Salvar Configuração)
            </button>
          </div>

          <button 
            onClick={handleReset}
            className="text-red-500 text-xs font-bold uppercase hover:underline text-left mt-2"
          >
            Restaurar Padrões
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-2xl min-h-[300px]">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-widest">Pré-visualização do Menu Lateral</p>
          <div className="flex flex-col cursor-pointer border border-dashed border-gray-600 p-4 rounded-lg bg-[#006b56]">
            {preview ? (
              <img src={preview} alt="Logo Preview" className="max-w-[200px] max-h-[80px] object-contain mb-1" />
            ) : (
              <span className="text-white font-black text-xl tracking-tighter leading-none mb-1">
                {textPreview ? '' : 'GRUPO ELORA'}
              </span>
            )}
            <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest leading-none mt-0.5" style={{ textAlign: preview ? 'center' : 'left' }}>
              {textPreview}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
