import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  trigger: string;
  count: number;
}

interface NotificationChartProps {
  data: ChartData[];
}

const NotificationChart: React.FC<NotificationChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis dataKey="trigger" stroke="#c9d1d9" tick={{ fill: '#c9d1d9' }} />
          <YAxis stroke="#c9d1d9" tick={{ fill: '#c9d1d9' }} />
          <Tooltip
            cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}
            contentStyle={{
              backgroundColor: '#161b22',
              borderColor: '#30363d',
              color: '#c9d1d9',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ color: '#c9d1d9' }} />
          <Bar dataKey="count" name="Notifications Sent" fill="#22d3ee" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NotificationChart;
