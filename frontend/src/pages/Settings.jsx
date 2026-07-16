import React from 'react';
import { useForm } from 'react-hook-form';
import { Sun, Moon, Bell, Shield, Languages, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

export const Settings = () => {
  const { theme, toggleTheme, user, updateProfile } = useApp();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      notificationsEnabled: user?.notificationsEnabled ?? true,
      language: user?.language || 'English',
      securityLevel: user?.securityLevel || 'High'
    }
  });

  const onSubmit = async (data) => {
    updateProfile(data);
    toast.success('System preferences stored successfully.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-display font-extrabold text-lg text-text">FOS Settings Console</h2>
        <p className="text-xs text-muted">Configure your Football Copilot system parameters, notifications, and language.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Theme Settings Widget */}
        <Card className="border border-border p-4 bg-card">
          <CardHeader className="mb-3">
            <CardTitle className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              🎨 UI Theme Profile
            </CardTitle>
            <CardDescription>Select your visual telemetry layout theme.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 flex items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-2 cursor-pointer transition-all ${
                theme === 'light' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border bg-background/50 hover:bg-border/20 text-muted'
              }`}
            >
              <Sun size={15} /> Light Theme
            </button>
            <button
              type="button"
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 flex items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-2 cursor-pointer transition-all ${
                theme === 'dark' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border bg-background/50 hover:bg-border/20 text-muted'
              }`}
            >
              <Moon size={15} /> Dark Theme
            </button>
          </CardContent>
        </Card>

        {/* Notifications & Language */}
        <Card className="border border-border p-4 bg-card space-y-4">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              🔧 System Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Notifications Toggle */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-text flex items-center gap-1.5">
                  <Bell size={14} className="text-muted" /> Live Broadcast Alerts
                </span>
                <p className="text-[10px] text-muted">Receive goal notifications and hot transfer deal feeds instantly.</p>
              </div>
              <input
                type="checkbox"
                {...register('notificationsEnabled')}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/45 cursor-pointer"
              />
            </div>

            {/* Language */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-text flex items-center gap-1.5">
                  <Languages size={14} className="text-muted" /> System Language
                </span>
                <p className="text-[10px] text-muted">Toggle local linguistic terms for match views.</p>
              </div>
              <select
                {...register('language')}
                className="bg-background border border-border text-text rounded-lg p-2 focus:outline-none cursor-pointer"
              >
                <option value="English">English (EN)</option>
                <option value="Spanish">Español (ES)</option>
                <option value="German">Deutsch (DE)</option>
                <option value="Italian">Italiano (IT)</option>
              </select>
            </div>

            {/* Security Level */}
            <div className="flex items-center justify-between pb-1">
              <div className="space-y-0.5">
                <span className="font-semibold text-text flex items-center gap-1.5">
                  <Shield size={14} className="text-muted" /> Encryption Security
                </span>
                <p className="text-[10px] text-muted">Define access token duration levels.</p>
              </div>
              <select
                {...register('securityLevel')}
                className="bg-background border border-border text-text rounded-lg p-2 focus:outline-none cursor-pointer"
              >
                <option value="High">High (AES-256)</option>
                <option value="Standard">Standard (SHA-512)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Store visual preferences
        </Button>
      </form>
    </div>
  );
};
export default Settings;
