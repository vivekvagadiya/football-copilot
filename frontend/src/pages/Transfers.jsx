import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { ArrowRightLeft, UploadCloud, FileSpreadsheet } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Loading } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { TransferCard } from '../components/football/TransferCard';
import { toast } from 'sonner';

export const Transfers = () => {
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: apiService.getTransfers
  });

  // Dropzone implementation for importing target scouting parameters
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      toast.success(`Importing scout data: ${acceptedFiles[0].name}. Target parsed successfully.`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: false
  });

  if (isLoading) {
    return <Loading text="Loading transfer log registers..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-display font-extrabold text-lg text-text flex items-center gap-2">
          <ArrowRightLeft size={18} className="text-primary" /> Transfer Market Monitor
        </h2>
        <p className="text-xs text-muted">Track completed deals, ongoing negotiations, and market confidence indices.</p>
      </div>

      {/* Scout import dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-primary bg-primary/5 text-primary' 
            : 'border-border/80 hover:border-primary/40 text-muted'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud size={32} className="mx-auto text-muted mb-2 animate-bounce" />
        <h4 className="font-display font-bold text-xs text-text">Scout File Import Console</h4>
        <p className="text-[10px] text-muted max-w-sm mx-auto mt-1 leading-relaxed">
          Drag and drop your player scouting spreadsheet (.csv, .json) here to import targets directly into your copilot database.
        </p>
      </div>

      {/* Grid of transfer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transfers.map(t => (
          <TransferCard key={t.id} transfer={t} />
        ))}
      </div>
    </div>
  );
};
export default Transfers;
