
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PortfolioData } from '../types';
import TerminalWindow from './TerminalWindow';

interface PortfolioChartProps {
  data: PortfolioData[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-green-500 p-2 text-green-400">
          <p className="label">{`시간 : ${label}`}</p>
          <p className="intro">{`가치 : $${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
  
    return null;
};

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  return (
    <TerminalWindow title="포트폴리오 가치">
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="#00ff41" strokeOpacity={0.2} strokeDasharray="3 3"/>
            <XAxis dataKey="time" stroke="#00ff41" tick={{ fill: '#00ff41' }} />
            <YAxis 
                stroke="#00ff41" 
                tick={{ fill: '#00ff41' }} 
                domain={['dataMin', 'dataMax']}
                tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{stroke: '#00ff41', strokeWidth: 1, strokeDasharray: "3 3"}}/>
            <Line type="monotone" dataKey="value" stroke="#39FF14" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </TerminalWindow>
  );
};

export default PortfolioChart;