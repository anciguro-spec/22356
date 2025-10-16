import { X, Download } from 'lucide-react';

interface QRCodePreviewModalProps {
  qrCodeUrl: string;
  productName: string;
  batchNumber: string;
  onClose: () => void;
}

export default function QRCodePreviewModal({
  qrCodeUrl,
  productName,
  batchNumber,
  onClose,
}: QRCodePreviewModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR-${batchNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Product QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{productName}</h3>
            <p className="text-sm text-gray-600 font-mono">{batchNumber}</p>
          </div>

          <div className="flex justify-center bg-gray-50 p-6 rounded-lg">
            <img
              src={qrCodeUrl}
              alt="Product QR Code"
              className="w-64 h-64 border-4 border-white shadow-lg rounded-lg"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">
              Scan this QR code to view the complete product traceability information
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
            >
              <Download className="w-5 h-5" />
              <span>Download QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
