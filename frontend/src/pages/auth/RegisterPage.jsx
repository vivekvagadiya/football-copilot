import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cpu, Mail, Lock, User, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { toast } from 'sonner';

const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const RegisterPage = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      login({
        username: data.username,
        email: data.email,
        favoriteTeamId: 'arsenal',
        favoriteLeagueId: 'pl',
        notificationsEnabled: true
      });
      toast.success('Registration complete. FOS initialized.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Initialization failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card className="border border-border/80 shadow-lg bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto p-2 bg-primary/10 rounded-lg w-fit text-primary border border-primary/20 mb-3">
            <Cpu size={24} />
          </div>
          <CardTitle className="text-xl font-bold font-display">Register FOS Token</CardTitle>
          <CardDescription>Setup your analytical profile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted block">Profile Name</label>
              <div className="relative flex items-center border border-border rounded-lg px-3 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45">
                <User size={15} className="text-muted mr-2" />
                <input
                  type="text"
                  {...register('username')}
                  placeholder="Gaffer_Tactician"
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
                  placeholder="gaffer@copilot.ai"
                  className="w-full py-2 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                  <ShieldAlert size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted block">Access Password</label>
              <div className="relative flex items-center border border-border rounded-lg px-3 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45">
                <Lock size={15} className="text-muted mr-2" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full py-2 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                  <ShieldAlert size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted block">Verify Password</label>
              <div className="relative flex items-center border border-border rounded-lg px-3 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45">
                <Lock size={15} className="text-muted mr-2" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full py-2 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                  <ShieldAlert size={12} /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? 'Registering Token...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted">
          <span>Already have a token? </span>
          <Link to="/login" className="text-primary hover:underline ml-1 font-semibold">
            Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default RegisterPage;
