import DashboardLayout from '../components/DashboardLayout';

export default function WMMPage() {
  return (
    <DashboardLayout currentPage="wmm">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Waste Management Metrics</h1>
          <p className="text-gray-600 mt-2">Track and analyze waste management performance</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <span className="text-2xl">🚧</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This feature is currently under development</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
