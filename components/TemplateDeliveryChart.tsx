import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TemplateData {
  sent_date: string;
  template: string;
  delivered_count: number;
}

interface Props {
  data: TemplateData[];
}

const TemplateDeliveryChart: React.FC<Props> = ({ data }) => {
  // Transform data for recharts - group by date with template counts
  const chartData: { [key: string]: any } = {};
  
  data.forEach(item => {
    if (!chartData[item.sent_date]) {
      chartData[item.sent_date] = { date: item.sent_date };
    }
    chartData[item.sent_date][item.template] = item.delivered_count;
  });

  const transformedData = Object.values(chartData).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get unique templates for colors
  const templates = Array.from(new Set(data.map(item => item.template)));
  
  const colors = [
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#3b82f6', // blue
    '#ef4444', // red
  ];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={transformedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#f3f4f6'
            }}
          />
          <Legend 
            wrapperStyle={{ color: '#9ca3af' }}
            formatter={(value) => {
              // Shorten template names for legend
              return value.replace('_reminder_', '_').replace('_payment_', '_');
            }}
          />
          {templates.map((template, index) => (
            <Line
              key={template}
              type="monotone"
              dataKey={template}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], r: 4 }}
              activeDot={{ r: 6 }}
              name={template}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TemplateDeliveryChart;
