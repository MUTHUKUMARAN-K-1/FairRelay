import { cn } from '../lib/utils';

const activities = [
  { id: 1, action: 'Sensor Calibration', user: 'Maria R.', time: '2 mins ago', status: 'Completed', color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 2, action: 'Energy Report Generated', user: 'Alex C.', time: '1 hour ago', status: 'Pending', color: 'bg-yellow-500/10 text-yellow-400' },
  { id: 3, action: 'Recycling Pickup Schedule', user: 'System', time: '3 hours ago', status: 'Scheduled', color: 'bg-blue-500/10 text-blue-400' },
  { id: 4, action: 'New Device Added (Sensor #321)', user: 'David K.', time: 'Yesterday', status: 'Active', color: 'bg-eco-teal-500/10 text-eco-teal-400' },
];

export function RecentActivity() {
  return (
    <div className="bg-eco-card backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-sm">
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-white/5 transition-colors text-sm">
                <td className="px-6 py-4 font-medium text-white">{activity.action}</td>
                <td className="px-6 py-4 text-gray-300">{activity.user}</td>
                <td className="px-6 py-4 text-gray-400">{activity.time}</td>
                <td className="px-6 py-4">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium", activity.color)}>
                    {activity.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
