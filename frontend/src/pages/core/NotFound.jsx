import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card hover={false} className="max-w-md w-full border border-border p-8 text-center space-y-6 bg-card shadow-xl">
        <div className="mx-auto p-3.5 bg-red-500/10 rounded-full w-fit text-red-500 border border-red-500/20 animate-pulse">
          <ShieldAlert size={36} />
        </div>

        <div className="space-y-2">
          <h2 className="font-display font-black text-2xl text-text leading-none">Tactical Link Severed</h2>
          <p className="text-xs text-muted leading-relaxed">
            The telemetry coordinates you entered are not mapped in the Football Copilot database matrix.
          </p>
        </div>

        <Button 
          variant="primary" 
          onClick={() => navigate('/dashboard')}
          className="w-full gap-2 text-xs py-2.5 font-bold"
        >
          <ArrowLeft size={14} /> Reconnect to Dashboard
        </Button>
      </Card>
    </div>
  );
};
export default NotFound;
