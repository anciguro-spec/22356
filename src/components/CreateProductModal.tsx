import { useState, useEffect } from 'react';
import { X, MapPin, Cloud, Upload, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrentPosition, type GeolocationData } from '../lib/geolocation';
import { getCurrentWeather, type WeatherData } from '../lib/weather';
import { generateQRCodeDataURL } from '../lib/qrcode';
import QRCodePreviewModal from './QRCodePreviewModal';

interface CreateProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProductModal({ onClose, onSuccess }: CreateProductModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    batchNumber: '',
    description: '',
    harvestDate: new Date().toISOString().split('T')[0],
    seedCropName: '',
    pesticideUsed: false,
    pesticideName: '',
    pesticideQuantity: '',
    pricePerUnit: '',
    weightTotal: '',
    notes: '',
  });

  const [gpsData, setGpsData] = useState<GeolocationData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captureStatus, setCaptureStatus] = useState({
    gps: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    weather: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQRPreview, setShowQRPreview] = useState(false);

  useEffect(() => {
    captureGPSAndWeather();
  }, []);

  const captureGPSAndWeather = async () => {
    setCaptureStatus({ gps: 'loading', weather: 'loading' });

    try {
      const position = await getCurrentPosition();
      setGpsData(position);
      setCaptureStatus((prev) => ({ ...prev, gps: 'success' }));

      try {
        const weather = await getCurrentWeather(position.latitude, position.longitude);
        setWeatherData(weather);
        setCaptureStatus((prev) => ({ ...prev, weather: 'success' }));
      } catch (weatherError) {
        console.error('Weather capture failed:', weatherError);
        setCaptureStatus((prev) => ({ ...prev, weather: 'error' }));
      }
    } catch (gpsError) {
      console.error('GPS capture failed:', gpsError);
      setCaptureStatus({ gps: 'error', weather: 'error' });
    }
  };

  const calculateTotalPrice = () => {
    const price = parseFloat(formData.pricePerUnit) || 0;
    const weight = parseFloat(formData.weightTotal) || 0;
    return (price * weight).toFixed(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const totalPrice = calculateTotalPrice();

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          batch_number: formData.batchNumber,
          description: formData.description,
          collector_id: profile?.id,
          current_phase: 'collector',
          status: 'pending',
        })
        .select()
        .single();

      if (productError) throw productError;

      const traceabilityUrl = `${window.location.origin}/trace/${product.id}`;
      const qrCode = await generateQRCodeDataURL(traceabilityUrl);

      const { error: phaseError } = await supabase.from('phase_records').insert({
        product_id: product.id,
        phase: 'collector',
        handler_id: profile?.id,
        status: 'pending',
        notes: formData.notes,
        gps_latitude: gpsData?.latitude,
        gps_longitude: gpsData?.longitude,
        weather_data: weatherData as any,
        harvest_date: formData.harvestDate,
        seed_crop_name: formData.seedCropName,
        pesticide_used: formData.pesticideUsed,
        pesticide_name: formData.pesticideUsed ? formData.pesticideName : null,
        pesticide_quantity: formData.pesticideUsed ? formData.pesticideQuantity : null,
        price_per_unit: parseFloat(formData.pricePerUnit) || null,
        weight_total: parseFloat(formData.weightTotal) || null,
        total_price: parseFloat(totalPrice) || null,
        qr_code_url: qrCode,
      });

      if (phaseError) throw phaseError;

      for (const file of documents) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${product.id}-${Date.now()}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Document upload failed:', uploadError);
          continue;
        }

        await supabase.from('documents').insert({
          product_id: product.id,
          file_name: file.name,
          file_type: file.type,
          ipfs_hash: filePath,
          uploaded_by: profile?.id,
        });
      }

      setQrCodeUrl(qrCode);
      setShowQRPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      setLoading(false);
    }
  };

  const handleCloseQRPreview = () => {
    setShowQRPreview(false);
    onSuccess();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-900">Create New Product</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">GPS Location</span>
                </div>
                {captureStatus.gps === 'loading' && (
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Capturing location...</span>
                  </div>
                )}
                {captureStatus.gps === 'success' && gpsData && (
                  <div className="text-sm text-blue-800">
                    <p>Lat: {gpsData.latitude.toFixed(6)}</p>
                    <p>Lon: {gpsData.longitude.toFixed(6)}</p>
                  </div>
                )}
                {captureStatus.gps === 'error' && (
                  <p className="text-sm text-red-600">Location unavailable</p>
                )}
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Cloud className="w-5 h-5 text-sky-600" />
                  <span className="font-semibold text-sky-900">Weather Conditions</span>
                </div>
                {captureStatus.weather === 'loading' && (
                  <div className="flex items-center space-x-2 text-sm text-sky-700">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Fetching weather...</span>
                  </div>
                )}
                {captureStatus.weather === 'success' && weatherData && (
                  <div className="text-sm text-sky-800">
                    <p>{weatherData.temperature}°C, {weatherData.humidity}% humidity</p>
                    <p>{weatherData.description}</p>
                  </div>
                )}
                {captureStatus.weather === 'error' && (
                  <p className="text-sm text-red-600">Weather unavailable</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="e.g., Organic Tomatoes"
                />
              </div>

              <div>
                <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="batchNumber"
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="e.g., BATCH-2025-001"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Brief description of the product..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Harvest Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="harvestDate"
                  type="date"
                  required
                  value={formData.harvestDate}
                  onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="seedCropName" className="block text-sm font-medium text-gray-700 mb-2">
                  Seed/Crop/Raw Material Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="seedCropName"
                  type="text"
                  required
                  value={formData.seedCropName}
                  onChange={(e) => setFormData({ ...formData, seedCropName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="e.g., Roma Tomato Seeds"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  id="pesticideUsed"
                  type="checkbox"
                  checked={formData.pesticideUsed}
                  onChange={(e) =>
                    setFormData({ ...formData, pesticideUsed: e.target.checked })
                  }
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="pesticideUsed" className="text-sm font-medium text-gray-700">
                  Pesticides Used
                </label>
              </div>

              {formData.pesticideUsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                  <div>
                    <label htmlFor="pesticideName" className="block text-sm font-medium text-gray-700 mb-2">
                      Pesticide Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="pesticideName"
                      type="text"
                      required
                      value={formData.pesticideName}
                      onChange={(e) =>
                        setFormData({ ...formData, pesticideName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="e.g., Organic Neem Oil"
                    />
                  </div>

                  <div>
                    <label htmlFor="pesticideQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="pesticideQuantity"
                      type="text"
                      required
                      value={formData.pesticideQuantity}
                      onChange={(e) =>
                        setFormData({ ...formData, pesticideQuantity: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="e.g., 500ml"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Unit ($) <span className="text-red-500">*</span>
                </label>
                <input
                  id="pricePerUnit"
                  type="number"
                  step="0.01"
                  required
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="weightTotal" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  id="weightTotal"
                  type="number"
                  step="0.01"
                  required
                  value={formData.weightTotal}
                  onChange={(e) => setFormData({ ...formData, weightTotal: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price ($)
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold">
                  {calculateTotalPrice()}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileUpload"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <label
                  htmlFor="fileUpload"
                  className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Click to upload documents
                </label>
                <p className="text-xs text-gray-500 mt-1">Images, PDFs, or documents</p>
              </div>

              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Collection Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Additional notes about collection conditions, handling, etc..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
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
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showQRPreview && qrCodeUrl && (
        <QRCodePreviewModal
          qrCodeUrl={qrCodeUrl}
          productName={formData.name}
          batchNumber={formData.batchNumber}
          onClose={handleCloseQRPreview}
        />
      )}
    </>
  );
}
