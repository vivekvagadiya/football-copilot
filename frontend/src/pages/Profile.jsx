import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, ShieldAlert, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { toast } from 'sonner';

const profileSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  favoriteTeamId: z.string(),
  favoriteLeagueId: z.string()
});

export const Profile = () => {
  const { user, updateProfile } = useApp();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      favoriteTeamId: user?.favoriteTeamId || 'arsenal',
      favoriteLeagueId: user?.favoriteLeagueId || 'pl'
    }
  });

  const onSubmit = async (data) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      updateProfile(data);
      toast.success('OS profile credentials updated successfully.');
    } catch (err) {
      toast.error('Could not update profile fields.');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card className="border border-border p-5 bg-card">
        <CardHeader className="text-center md:text-left flex flex-col md:flex-row items-center gap-4 mb-4 pb-4 border-b border-border/40">
          <Avatar fallback={user?.username[0]} size="xl" className="shrink-0" />
          <div className="space-y-1">
            <CardTitle className="text-base font-bold font-display">{user?.username}</CardTitle>
            <CardDescription>Gaffer / Analytical FOS user credentials</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted block">Profile Nickname</label>
              <div className="relative flex items-center border border-border rounded-lg px-3 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45">
                <User size={15} className="text-muted mr-2" />
                <input
                  type="text"
                  {...register('username')}
                  className="w-full py-2 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {errors.username && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                  <ShieldAlert size={12} /> {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted block">Email Address</label>
              <div className="relative flex items-center border border-border rounded-lg px-3 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45">
                <Mail size={15} className="text-muted mr-2" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full py-2 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                  <ShieldAlert size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Preferred settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted block">Club Loyalty</label>
                <select
                  {...register('favoriteTeamId')}
                  className="w-full border border-border bg-background/50 rounded-lg p-2.5 text-xs text-text focus:outline-none"
                >
                  <option value="arsenal">Arsenal</option>
                  <option value="mancity">Manchester City</option>
                  <option value="realmadrid">Real Madrid</option>
                  <option value="barcelona">Barcelona</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted block">Main Competition</label>
                <select
                  {...register('favoriteLeagueId')}
                  className="w-full border border-border bg-background/50 rounded-lg p-2.5 text-xs text-text focus:outline-none"
                >
                  <option value="pl">Premier League</option>
                  <option value="laliga">La Liga</option>
                  <option value="seriea">Serie A</option>
                  <option value="bundesliga">Bundesliga</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
              {isSubmitting ? 'Saving modifications...' : 'Update credentials'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default Profile;
