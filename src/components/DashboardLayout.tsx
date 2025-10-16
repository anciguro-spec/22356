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
  LayoutDashboard,
  FileText
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
  processing: Factory,
  manufacturing: Briefcase,
  admin: Shield,
};

const roleLabels: Record<UserRole, string> = {
  collector: 'Collector',
  tester: 'Quality Tester',
  processing: 'Processing Unit',
  manufacturing: 'Manufacturing',
  admin: 'Administrator',
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'traceability', label: 'Traceability', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900">FoodChain</span>
          </div>

          {profile && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <RoleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile.full_name || profile.email}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {roleLabels[profile.role]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/${item.id === 'dashboard' ? 'dashboard' : item.id}`)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>

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
