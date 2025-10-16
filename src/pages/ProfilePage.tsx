import { useEffect, useState } from 'react';
import { User, Package, TestTube, Factory, Briefcase, Wallet } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/database';

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

const roleColors: Record<UserRole, string> = {
  collector: 'bg-blue-600',
  tester: 'bg-purple-600',
  producer: 'bg-green-600',
  manufacturer: 'bg-orange-600',
};

export default function ProfilePage() {
  const { profile } = useAuth();
  const [batchCount, setBatchCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadBatchCount();
    }
  }, [profile]);

  const loadBatchCount = async () => {
    try {
      if (!profile) return;

      if (profile.role === 'collector') {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('collector_id', profile.id);

        if (error) throw error;
        setBatchCount(count || 0);
      } else {
        const { count, error } = await supabase
          .from('phase_records')
          .select('*', { count: 'exact', head: true })
          .eq('handler_id', profile.id);

        if (error) throw error;
        setBatchCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading batch count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const RoleIcon = roleIcons[profile.role];
  const roleColor = roleColors[profile.role];

  return (
    <DashboardLayout currentPage="profile">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Your account information and statistics</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className={`${roleColor} h-32`} />

          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              <div className={`w-32 h-32 ${roleColor} rounded-2xl flex items-center justify-center border-4 border-white shadow-lg`}>
                <RoleIcon className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || 'User'}
                </h2>
                <p className="text-lg text-gray-600 mt-1">
                  {roleLabels[profile.role]}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Username</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {profile.full_name || profile.email.split('@')[0]}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Package className="w-4 h-4" />
                    <span className="text-sm font-medium">Role</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {roleLabels[profile.role]}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">Wallet Address</span>
                  </div>
                  <p className="text-gray-900 font-mono text-sm break-all">
                    {profile.wallet_address || 'Not connected'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Package className="w-4 h-4" />
                    <span className="text-sm font-medium">Total Batches Submitted</span>
                  </div>
                  <p className="text-gray-900 font-medium text-2xl">
                    {loading ? '...' : batchCount}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-900">Rating System</h3>
                      <p className="text-sm text-yellow-800 mt-1">
                        Under development - Rating functionality will be available soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
