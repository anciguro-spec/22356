import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Package,
  TestTube,
  Factory,
  Briefcase,
  LogOut,
  User,
  CheckCircle,
  Clock,
  Bot,
  Recycle,
  Receipt
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/database';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
}

const roleIcons: Record<UserRole, any> = {
  collector: Package,
  tester: TestTube,
  producer: Factory,
  manufacturer: Briefcase,
};

const roleLabels: Record<UserRole, string> = {
  collector: 'Collector',
  tester: 'Tester',
  producer: 'Producer',
  manufacturer: 'Manufacturer',
};

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const RoleIcon = profile ? roleIcons[profile.role] : Shield;

  const menuItems = [
    { id: 'active-batches', label: 'Active Batches', icon: Clock },
    { id: 'completed-batches', label: 'Completed Batches', icon: CheckCircle },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'wmm', label: 'Waste Management Metrics', icon: Recycle },
    { id: 'transaction-history', label: 'Transaction History', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900">FoodChain</span>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {profile && (
            <div className="mb-6">
              <button
                onClick={() => navigate('/profile')}
                className="w-full p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RoleIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {profile.full_name || profile.email}
                    </p>
                    <p className="text-xs text-emerald-700 font-medium">
                      {roleLabels[profile.role]}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/${item.id}`)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
