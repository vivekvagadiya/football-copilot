import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cpu, Mail, Lock, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email credentials' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

export const LoginPage = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'gaffer@copilot.ai',
      password: 'password123'
    }
  });

  const onSubmit = async (data) => {
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      login({
        username: data.email.split('@')[0],
        email: data.email,
        favoriteTeamId: 'arsenal',
        favoriteLeagueId: 'pl',
        notificationsEnabled: true
      });
      toast.success('Access Granted. Connecting FOS session.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Authentication rejected.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <Card className="border border-border/80 shadow-lg bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto p-2 bg-primary/10 rounded-lg w-fit text-primary border border-primary/20 mb-3">
            <Cpu size={24} />
          </div>
          <CardTitle className="text-xl font-bold font-display">Access Football Copilot</CardTitle>
          <CardDescription>Enter credentials to restore your operating system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted block">Session Email</label>
              <div className="relative flex items-center border border-border rounded-lg px-3 bg-background/50 focus-within:ring-2 focus-within:ring-primary/45">
                <Mail size={15} className="text-muted mr-2" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@club.com"
                  className="w-full py-2 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                  <ShieldAlert size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted block">Access Token (Password)</label>
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

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? 'Authenticating...' : 'Establish Session'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted">
          <span>First time here? </span>
          <Link to="/register" className="text-primary hover:underline ml-1 font-semibold">
            Register System Token
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default LoginPage;
