import React, { useState, useEffect, useMemo } from 'react';
import { Study } from '../types';
import { db } from '../database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardView: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);

  useEffect(() => {
    db.getAll<Study>('studies').then(setStudies);
  }, []);

  const studiesByYearData = useMemo(() => {
    const countsByYear: Record<string, number> = {};
    studies.forEach(study => {
      if (study.initialOpinionApprovalDate) {
        let year = '';
        if (study.initialOpinionApprovalDate.includes('-')) {
          year = study.initialOpinionApprovalDate.split('-')[0];
        } else if (study.initialOpinionApprovalDate.includes('/')) {
          const parts = study.initialOpinionApprovalDate.split('/');
          year = parts.length === 3 ? parts[2] : '';
        }
        
        if (year && year.length === 4) {
          countsByYear[year] = (countsByYear[year] || 0) + 1;
        }
      }
    });

    return Object.keys(countsByYear).sort().map(year => ({
      name: year,
      quantidade: countsByYear[year]
    }));
  }, [studies]);

  return (
    <div className="flex h-full w-full bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar Filters */}
      <div className="w-48 bg-[#005a48] text-white p-4 flex flex-col gap-6 shrink-0 border-r border-[#004a3b]">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-center tracking-widest uppercase mt-4">DashBoard</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-7 gap-2 shrink-0">
          {[
            { label: 'Income', value: '757,345', change: '-83% from previous 89 days', color: 'text-orange-400' },
            { label: 'Cost Of Goods Sold', value: '157,564', change: '-79% from previous 89 days', color: 'text-orange-400' },
            { label: 'Gross Profit', value: '599,782', change: '-84% from previous 89 days', color: 'text-orange-400' },
            { label: 'Gross Profit', value: '79%', change: '-4% from previous 89 days', color: 'text-gray-400' },
            { label: 'Overheads', value: '375,129', change: '-86% from previous 89 days', color: 'text-orange-400' },
            { label: 'Net Income', value: '230,514', change: '-81% from previous 89 days', color: 'text-gray-400' },
            { label: 'Net Income', value: '30%', change: '3% from previous 89 days', color: 'text-gray-400' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white p-3 rounded shadow-sm flex flex-col items-center justify-between border border-gray-200 h-24">
              <span className="text-[10px] font-bold text-gray-800">{kpi.label}</span>
              <span className="text-xl font-light text-gray-700">{kpi.value}</span>
              <span className={`text-[8px] font-medium text-center ${kpi.color}`}>{kpi.change}</span>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Column (Charts) */}
          <div className="col-span-7 flex flex-col gap-4">
            {/* Profit Trend (Studies by Year) */}
            <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-4 flex flex-col">
              <h3 className="text-xs font-bold text-center text-gray-800 mb-4">Estudos Iniciados / Ano (Parecer Inicial)</h3>
              <div className="flex-1 w-full min-h-[200px]">
                {studiesByYearData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studiesByYearData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ fontSize: '10px', borderRadius: '4px', border: '1px solid #E5E7EB' }}
                        itemStyle={{ color: '#005a48', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quantidade" 
                        name="Quantidade"
                        stroke="#005a48" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#005a48', strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs bg-gray-50/50">
                    Nenhum dado disponível.
                  </div>
                )}
              </div>
            </div>
            {/* Income & Expenses Trend */}
            <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-4 flex flex-col">
              <h3 className="text-xs font-bold text-center text-gray-800 mb-4">Income & Expenses Trend</h3>
              <div className="flex-1 border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs bg-gray-50/50">
                [ Gráfico de Barras/Linha: Income & Expenses Trend ]
              </div>
            </div>
          </div>

          {/* Right Column (Tables/Bars) */}
          <div className="col-span-5 flex flex-col gap-4">
            {/* Income by Group */}
            <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4 px-8">
                <h3 className="text-xs font-bold text-gray-800">Income by Group</h3>
                <h3 className="text-xs font-bold text-gray-800">Income by Transaction</h3>
              </div>
              <div className="flex-1 border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs bg-gray-50/50">
                [ Tabela/Barras Horizontais: Income ]
              </div>
            </div>
            {/* Overheads by Group */}
            <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4 px-8">
                <h3 className="text-xs font-bold text-gray-800">Overheads by Group</h3>
                <h3 className="text-xs font-bold text-gray-800">Overheads by Transaction</h3>
              </div>
              <div className="flex-1 border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs bg-gray-50/50">
                [ Tabela/Barras Horizontais: Overheads ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
