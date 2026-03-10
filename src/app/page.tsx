import Link from 'next/link';
import { Users, LayoutDashboard, Stethoscope } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center mb-16 space-y-4">
        <div className="flex justify-center mb-6">
           <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
             <Stethoscope className="w-12 h-12 text-white" />
           </div>
        </div>
        <h1 className="text-5xl font-bold text-slate-900 tracking-tight">CRODUS AI</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Intelligent Healthcare Management System
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link 
          href="/intake"
          className="group relative bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-500 transition-all duration-300 p-10 flex flex-col items-center text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Users className="w-16 h-16 text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300" />
          <h2 className="text-3xl font-bold text-slate-900 mb-3 relative">Patient Intake</h2>
          <p className="text-slate-500 text-lg relative">
            New patients start here. Submit symptoms and schedule appointments.
          </p>
          <div className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Get Started
          </div>
        </Link>

        <Link 
          href="/dashboard"
          className="group relative bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-500 transition-all duration-300 p-10 flex flex-col items-center text-center"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <LayoutDashboard className="w-16 h-16 text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300" />
          <h2 className="text-3xl font-bold text-slate-900 mb-3 relative">Admin Dashboard</h2>
          <p className="text-slate-500 text-lg relative">
            Staff and administrators. Manage patients, doctors, and schedules.
          </p>
          <div className="mt-8 px-6 py-3 bg-purple-600 text-white rounded-full font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Access Portal
          </div>
        </Link>
      </div>
    </div>
  );
}
