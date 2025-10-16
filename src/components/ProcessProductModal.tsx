import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database, Phase, Status } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];

interface ProcessProductModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

const phaseOrder: Phase[] = ['collector', 'tester', 'processing', 'manufacturing'];

export default function ProcessProductModal({ product, onClose, onSuccess }: ProcessProductModalProps) {
  const { profile } = useAuth();
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [testResults, setTestResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const status: Status = decision;

      const { error: phaseError } = await supabase.from('phase_records').insert({
        product_id: product.id,
        phase: product.current_phase,
        handler_id: profile?.id,
        status: status,
        notes: notes,
        test_results: testResults ? JSON.parse(testResults) : null,
      });

      if (phaseError) throw phaseError;

      const currentPhaseIndex = phaseOrder.indexOf(product.current_phase);
      const isLastPhase = currentPhaseIndex === phaseOrder.length - 1;

      let updateData: any = { status };

      if (status === 'approved' && !isLastPhase) {
        const nextPhase = phaseOrder[currentPhaseIndex + 1];
        updateData.current_phase = nextPhase;
        updateData.status = 'pending';
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Process Product</h2>
            <p className="text-sm text-gray-600 mt-1">
              {product.name} - {product.batch_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Decision</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-lg border-2 transition-all ${
                  decision === 'approved'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 text-gray-700 hover:border-emerald-300'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-lg border-2 transition-all ${
                  decision === 'rejected'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:border-red-300'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Reject</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="Add your observations, test results, or other relevant information..."
            />
          </div>

          {profile?.role === 'tester' && (
            <div>
              <label htmlFor="testResults" className="block text-sm font-medium text-gray-700 mb-2">
                Test Results (JSON format - optional)
              </label>
              <textarea
                id="testResults"
                rows={4}
                value={testResults}
                onChange={(e) => setTestResults(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-mono text-sm"
                placeholder='{"pH": 6.5, "temperature": 4, "bacteria_count": "low"}'
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter test data as valid JSON or leave empty
              </p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md ${
                decision === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Processing...' : `${decision === 'approved' ? 'Approve' : 'Reject'} Product`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
