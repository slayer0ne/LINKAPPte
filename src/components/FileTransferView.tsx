import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileImage,
  FileVideo,
  FileArchive,
  Download,
  CheckCircle2,
  AlertCircle,
  HardDriveDownload,
  Share2,
  QrCode
} from 'lucide-react';
import type { ConnectionState, FileTransferItem } from '../types/linkpair';

interface FileTransferViewProps {
  files: FileTransferItem[];
  onSendFile: (file: File) => void;
  connectionState: ConnectionState;
  onOpenPairing: () => void;
}

export const FileTransferView: React.FC<FileTransferViewProps> = ({
  files,
  onSendFile,
  connectionState,
  onOpenPairing
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isConnected = connectionState === 'connected';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => onSendFile(file));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => onSendFile(file));
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-6 h-6 text-emerald-400" />;
    if (type.startsWith('video/')) return <FileVideo className="w-6 h-6 text-purple-400" />;
    if (type.includes('zip') || type.includes('compressed') || type.includes('tar') || type.includes('apk'))
      return <FileArchive className="w-6 h-6 text-amber-400" />;
    return <FileText className="w-6 h-6 text-cyan-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span>P2P High-Speed Dateiübertragung</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-mono">
              WebRTC DataChannel
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dateien fließen ohne Größenbeschränkung direkt zwischen Ihren Geräten – ohne Cloud-Zwischenspeicher.
          </p>
        </div>

        {!isConnected && (
          <button
            onClick={onOpenPairing}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-md hover:from-cyan-400 hover:to-blue-500 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Gerät koppeln</span>
          </button>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30 scale-[0.99]'
            : 'border-slate-700 bg-slate-950/40 hover:border-cyan-500/60 hover:bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 flex items-center justify-center mb-3 shadow-inner">
          <UploadCloud className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-white">
          Dateien hier ablegen oder zum Auswählen klicken
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Fotos, Videos, Dokumente oder Android APKs direkt und verschlüsselt an das verbundene Gerät senden.
        </p>
        <div className="mt-3 flex items-center space-x-2 text-[11px] text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
          <Share2 className="w-3.5 h-3.5" />
          <span>Kein Limit • Volle WLAN/LAN-Geschwindigkeit</span>
        </div>
      </div>

      {/* Transfer History / Active Queue */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Übertragungen ({files.length})
        </h3>

        {files.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            Noch keine Dateiübertragungen durchgeführt.
          </div>
        ) : (
          files.map((file) => {
            const isMe = file.sender === 'me';
            return (
              <div
                key={file.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col space-y-2 transition shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatFileSize(file.size)} • {isMe ? 'Gesendet' : 'Empfangen'} •{' '}
                        <span className="font-mono text-cyan-400">{file.speed}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {file.status === 'completed' && (
                      <span className="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Abgeschlossen</span>
                      </span>
                    )}
                    {file.status === 'error' && (
                      <span className="flex items-center space-x-1 text-rose-400 text-xs font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Fehler</span>
                      </span>
                    )}
                    {file.url && (
                      <a
                        href={file.url}
                        download={file.name}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Herunterladen</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === 'transferring' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Wird übertragen...</span>
                      <span className="font-mono font-bold text-cyan-300">{file.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-150"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
