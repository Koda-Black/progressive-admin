import { useState } from "react";
import { Download, QrCode, Printer } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface QRCodeData {
  tableNumber: string;
  url: string;
  qrCodeUrl: string;
}

export default function QrGeneratorPage() {
  const [tableRange, setTableRange] = useState({ from: 1, to: 9 });
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [singleTable, setSingleTable] = useState("01");
  const [singleQr, setSingleQr] = useState<QRCodeData | null>(null);

  const generateBatch = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/qr/batch`, {
        params: {
          start: tableRange.from,
          end: tableRange.to,
        },
      });

      if (response.data.success && response.data.data.qrCodes) {
        setQrCodes(response.data.data.qrCodes);
      }
    } catch (error) {
      console.error("Failed to generate QR codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSingle = async () => {
    if (!singleTable) return;

    const tableNum = singleTable.startsWith("T")
      ? singleTable
      : `T${singleTable.padStart(2, "0")}`;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/admin/qr/generate`, {
        tableNumber: tableNum.toUpperCase(),
      });

      if (response.data.success) {
        setSingleQr(response.data.data);
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQr = async (tableNumber: string, qrUrl: string) => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `progressive-bar-${tableNumber}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: open in new tab
      window.open(qrUrl, "_blank");
    }
  };

  const printAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Calculate pages (9 QR codes per A4 page)
    const qrPerPage = 9;
    const pages: QRCodeData[][] = [];
    for (let i = 0; i < qrCodes.length; i += qrPerPage) {
      pages.push(qrCodes.slice(i, i + qrPerPage));
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Progressive Bar - QR Codes</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background: white; }
            .page { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 15mm;
              page-break-after: always;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              grid-template-rows: repeat(3, 1fr);
              gap: 10mm;
            }
            .page:last-child { page-break-after: auto; }
            .qr-item { 
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 2px dashed #ccc;
              border-radius: 8px;
              padding: 8mm;
              background: #fafafa;
            }
            .qr-item img { 
              width: 45mm; 
              height: 45mm;
              object-fit: contain;
            }
            .qr-item .table-num { 
              margin-top: 5mm;
              font-weight: bold; 
              font-size: 24px;
              color: #333;
            }
            .qr-item .brand {
              font-size: 12px;
              color: #666;
              margin-top: 2mm;
            }
            .qr-item .instruction {
              font-size: 10px;
              color: #999;
              margin-top: 2mm;
              text-align: center;
            }
            h1 { 
              text-align: center; 
              margin-bottom: 10mm;
              font-size: 24px;
              color: #333;
            }
            @media print { 
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .page { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${pages
            .map(
              (pageQrs) => `
            <div class="page">
              ${pageQrs
                .map(
                  (qr) => `
                <div class="qr-item">
                  <img src="${qr.qrCodeUrl}" alt="${qr.tableNumber}" />
                  <div class="table-num">${qr.tableNumber}</div>
                  <div class="brand">Progressive Bar</div>
                  <div class="instruction">Scan to order</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">QR Code Generator</h1>
        <p className="text-gray-400">Generate QR codes for table ordering</p>
      </div>

      {/* Single QR Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-500" />
          Generate Single QR Code
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-400 font-bold">T</span>
            <input
              type="text"
              value={singleTable}
              onChange={(e) =>
                setSingleTable(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              placeholder="01"
              maxLength={2}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg py-3 px-4 
                       text-white text-center font-bold text-xl focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={generateSingle}
            disabled={isLoading || !singleTable}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white 
                     font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50
                     flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Generate
          </button>
        </div>

        {singleQr && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex flex-col items-center p-6 bg-white rounded-xl"
          >
            <img
              src={singleQr.qrCodeUrl}
              alt={`QR for ${singleQr.tableNumber}`}
              className="w-48 h-48"
              crossOrigin="anonymous"
            />
            <p className="text-gray-800 font-bold text-2xl mt-4">
              {singleQr.tableNumber}
            </p>
            <p className="text-gray-500 text-sm">Progressive Bar</p>
            <p className="text-gray-400 text-xs mt-1">Scan to order</p>
            <button
              onClick={() =>
                downloadQr(singleQr.tableNumber, singleQr.qrCodeUrl)
              }
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg 
                       text-gray-700 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Batch Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-amber-500" />
          Batch Generate (A4 Print Ready)
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Generates 9 QR codes per A4 page, optimized for printing and cutting
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-gray-400">From Table</label>
            <span className="text-gray-400 font-bold">T</span>
            <input
              type="number"
              value={tableRange.from}
              onChange={(e) =>
                setTableRange((prev) => ({
                  ...prev,
                  from: Math.max(
                    1,
                    Math.min(99, parseInt(e.target.value) || 1)
                  ),
                }))
              }
              min={1}
              max={99}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 w-16 
                       text-white text-center focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-400">To Table</label>
            <span className="text-gray-400 font-bold">T</span>
            <input
              type="number"
              value={tableRange.to}
              onChange={(e) =>
                setTableRange((prev) => ({
                  ...prev,
                  to: Math.max(1, Math.min(99, parseInt(e.target.value) || 10)),
                }))
              }
              min={1}
              max={99}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 w-16 
                       text-white text-center focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={generateBatch}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white 
                     font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50
                     flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            {isLoading ? "Generating..." : "Generate Batch"}
          </button>
        </div>

        {qrCodes.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div>
                <span className="text-green-400 font-bold">
                  {qrCodes.length} QR codes generated
                </span>
                <span className="text-gray-400 ml-2">
                  ({Math.ceil(qrCodes.length / 9)} A4 page
                  {Math.ceil(qrCodes.length / 9) > 1 ? "s" : ""})
                </span>
              </div>
              <button
                onClick={printAll}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg 
                         flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print All (A4)
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3">
              {qrCodes.map((qr) => (
                <motion.div
                  key={qr.tableNumber}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg p-3 text-center"
                >
                  <img
                    src={qr.qrCodeUrl}
                    alt={`QR for ${qr.tableNumber}`}
                    className="w-full aspect-square"
                    crossOrigin="anonymous"
                  />
                  <p className="text-gray-800 font-bold text-sm mt-1">
                    {qr.tableNumber}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
