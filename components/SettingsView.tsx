
import React, { useState } from 'react';

interface SettingsViewProps {
  currentLogo: string | null;
  onLogoUpdate: (logoData: string | null) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentLogo, onLogoUpdate }) => {
  const [preview, setPreview] = useState<string | null>(currentLogo);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setPreview(result);
          onLogoUpdate(result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Por favor, selecione apenas arquivos PNG ou JPEG.');
      }
    }
  };

  const handleReset = () => {
    setPreview(null);
    onLogoUpdate(null);
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
            Selecione uma imagem (.png ou .jpeg) para substituir o logo padrão do Grupo Elora na tela inicial (Dashboard). 
            Recomendamos imagens com fundo transparente.
          </p>
          
          <div className="mt-4">
            <label className="cursor-pointer bg-[#007b63] text-white px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-[#00604d] transition-colors inline-block text-center w-full md:w-auto">
              <span>Carregar Nova Imagem</span>
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleFileChange}
                className="hidden" 
              />
            </label>
          </div>

          <button 
            onClick={handleReset}
            className="text-red-500 text-xs font-bold uppercase hover:underline text-left mt-2"
          >
            Restaurar Logo Padrão
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 min-h-[300px]">
          <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-widest">Pré-visualização</p>
          {preview ? (
            <img src={preview} alt="Logo Preview" className="max-w-full max-h-[250px] object-contain" />
          ) : (
             <div className="text-gray-300 font-bold italic text-sm">Logo Padrão (SVG) Ativo</div>
          )}
        </div>
      </div>
    </div>
  );
};
