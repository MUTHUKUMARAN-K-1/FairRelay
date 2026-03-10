import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Solar', value: 45, color: '#10b981' }, // eco-emerald-500
  { name: 'Wind', value: 30, color: '#2dd4bf' },  // eco-teal-400
  { name: 'Hydro', value: 15, color: '#0ea5e9' }, // sky-500
  { name: 'Grid', value: 10, color: '#64748b' },  // slate-500
];

export function EnergyPieChart() {
  return (
    <div className="bg-eco-card backdrop-blur-md rounded-xl p-6 border border-white/10 h-full">
      <h3 className="text-lg font-semibold text-white mb-6">Energy Sources</h3>
      
      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '8px' 
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-2xl font-bold text-white">100%</div>
          <div className="text-xs text-gray-400">Renewable</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {data.map((item) => (
          <div key={item.name} className="flex items-center text-sm">
            <span 
              className="w-2 h-2 rounded-full mr-2" 
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-gray-300">{item.name} ({item.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
