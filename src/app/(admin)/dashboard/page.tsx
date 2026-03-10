import { getBase, TABLE_APPOINTMENT_REQUESTS, TABLE_APPOINTMENTS, TABLE_TRIAGE_RESULTS } from "@/lib/airtable";
import { Users, Calendar, Activity, AlertCircle, Clock } from "lucide-react";
import QueryBox from "@/components/QueryBox";

export const revalidate = 0; // Disable cache for real-time data

async function getStats() {
  const base = getBase();
  
  // Parallel fetch
  const [requests, appointments] = await Promise.all([
    base(TABLE_APPOINTMENT_REQUESTS).select().all(),
    base(TABLE_APPOINTMENTS).select().all()
  ]);

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.fields.Status === "Pending").length;
  const triaged = totalRequests - pendingRequests;
  
  const urgent = appointments.filter(r => r.fields.Urgency === "Critical" || r.fields.Urgency === "High").length;
  
  const byDept: Record<string, number> = {};
  appointments.forEach(r => {
    const d = (r.fields.Department as string) || "Unassigned";
    byDept[d] = (byDept[d] || 0) + 1;
  });

  return { totalRequests, pendingRequests, triaged, urgent, byDept, totalAppointments: appointments.length };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of hospital operations and triage status.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pending Triage" 
          value={stats.pendingRequests} 
          icon={Clock} 
          color="text-amber-600" 
          bg="bg-amber-50" 
        />
        <StatCard 
          title="Total Requests" 
          value={stats.totalRequests} 
          icon={Users} 
          color="text-blue-600" 
          bg="bg-blue-50" 
        />
        <StatCard 
          title="Urgent Cases" 
          value={stats.urgent} 
          icon={AlertCircle} 
          color="text-red-600" 
          bg="bg-red-50" 
        />
        <StatCard 
          title="Appointments" 
          value={stats.totalAppointments} 
          icon={Calendar} 
          color="text-green-600" 
          bg="bg-green-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart/List Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Appointments by Department</h2>
            <div className="space-y-4">
              {Object.entries(stats.byDept).map(([dept, count]) => (
                <div key={dept} className="flex items-center">
                  <div className="w-32 text-sm font-medium text-gray-600">{dept}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${(count / stats.totalAppointments) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-gray-900">{count}</div>
                </div>
              ))}
              {Object.keys(stats.byDept).length === 0 && (
                <p className="text-sm text-gray-400">No appointment data available.</p>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h2 className="text-lg font-semibold mb-2">AI Query Assistant</h2>
             <p className="text-sm text-gray-500 mb-4">Ask questions about your data (e.g., "How many cardiology cases today?")</p>
             <QueryBox />
          </div>
        </div>

        {/* Sidebar / Actions */}
        <div className="space-y-6">
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md">
            <h3 className="font-semibold text-lg mb-2">System Health</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Triage Engine</span>
                <span className="bg-green-400/20 text-green-100 px-2 py-0.5 rounded text-xs">Online</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Scheduler</span>
                <span className="bg-green-400/20 text-green-100 px-2 py-0.5 rounded text-xs">Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Database</span>
                <span className="bg-green-400/20 text-green-100 px-2 py-0.5 rounded text-xs">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
