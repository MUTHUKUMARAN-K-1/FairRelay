import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', current: 230, previous: 170 },
  { name: 'Feb', current: 180, previous: 190 },
  { name: 'Mar', current: 150, previous: 120 },
  { name: 'Apr', current: 150, previous: 115 },
  { name: 'May', current: 110, previous: 70 },
  { name: 'Jun', current: 90, previous: 65 },
];

export function CarbonChart() {
  return (
    <div className="bg-eco-card backdrop-blur-md rounded-xl p-6 border border-white/10 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Carbon Footprint Over Time</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-eco-emerald-400 mr-2"></span>
            <span className="text-gray-400">Current Year</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-eco-teal-400 mr-2"></span>
            <span className="text-gray-400">Previous Year</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              tickLine={false} 
              axisLine={false}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '8px',
                color: '#fff'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="current" 
              stroke="#34d399" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="previous" 
              stroke="#2dd4bf" 
              strokeWidth={3} 
              strokeDasharray="4 4" 
              dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 0 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
