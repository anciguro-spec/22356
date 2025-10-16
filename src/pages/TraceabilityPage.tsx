import { useState } from 'react';
import { Search, Package, User, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import type { Database, Phase } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type PhaseRecord = Database['public']['Tables']['phase_records']['Row'];

interface TraceabilityData extends Product {
  phaseRecords: (PhaseRecord & { handler: { full_name: string; email: string } | null })[];
}

export default function TraceabilityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [traceData, setTraceData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setError('');
    setLoading(true);
    setTraceData(null);

    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('batch_number', searchQuery.trim())
        .maybeSingle();

      if (productError) throw productError;

      if (!product) {
        setError('Product not found with this batch number');
        setLoading(false);
        return;
      }

      const { data: phaseRecords, error: phaseError } = await supabase
        .from('phase_records')
        .select('*, handler:profiles(full_name, email)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: true });

      if (phaseError) throw phaseError;

      setTraceData({
        ...product,
        phaseRecords: phaseRecords || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load traceability data');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (phase: Phase) => {
    const icons = {
      collector: Package,
      tester: CheckCircle,
      processing: FileText,
      manufacturing: User,
    };
    return icons[phase] || Package;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <DashboardLayout currentPage="traceability">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Traceability</h1>
          <p className="text-gray-600">Search and view complete supply chain history</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter batch number to trace product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {traceData && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Product Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Product Name</p>
                  <p className="text-lg font-semibold text-gray-900">{traceData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Batch Number</p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{traceData.batch_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Phase</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{traceData.current_phase}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Status</p>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      getStatusBadge(traceData.status).bg
                    } ${getStatusBadge(traceData.status).text}`}
                  >
                    {traceData.status}
                  </span>
                </div>
                {traceData.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-gray-900">{traceData.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Supply Chain Journey</h2>
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-8">
                  {traceData.phaseRecords.map((record, index) => {
                    const PhaseIcon = getPhaseIcon(record.phase);
                    const statusStyle = getStatusBadge(record.status);
                    const StatusIcon = statusStyle.icon;

                    return (
                      <div key={record.id} className="relative pl-16">
                        <div className="absolute left-0 w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center border-4 border-white shadow-md">
                          <PhaseIcon className="w-8 h-8 text-emerald-600" />
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 capitalize mb-1">
                                {record.phase} Phase
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(record.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-5 h-5" />
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}
                              >
                                {record.status}
                              </span>
                            </div>
                          </div>

                          {record.handler && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600">Handled by:</p>
                              <p className="text-sm font-medium text-gray-900">
                                {record.handler.full_name || record.handler.email}
                              </p>
                            </div>
                          )}

                          {record.notes && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-1">Notes:</p>
                              <p className="text-sm text-gray-900">{record.notes}</p>
                            </div>
                          )}

                          {record.test_results && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Test Results:</p>
                              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                                {JSON.stringify(record.test_results, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {!traceData && !loading && !error && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Product Selected</h3>
            <p className="text-gray-600">Enter a batch number above to view complete traceability information</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
