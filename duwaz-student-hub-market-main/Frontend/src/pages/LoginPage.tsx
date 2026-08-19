import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  // Where to go after a normal login
  const from = (location.state as any)?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (forceAdminRedirect: boolean) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(formData);
      const role = (response.role ?? 'CUSTOMER') as 'CUSTOMER' | 'ADMIN';

      login(response.token, {
        userId: response.userId,
        studentName: response.studentName,
        email: response.email,
        role,
      });

      toast({ title: 'Welcome back!', description: `Signed in as ${response.studentName}` });

      if (forceAdminRedirect || role === 'ADMIN') {
        if (role !== 'ADMIN') {
          toast({
            title: 'Access denied',
            description: 'This account does not have admin privileges.',
            variant: 'destructive',
          });
          return;
        }
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(adminMode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-500 hover:text-duwaz-brown transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-duwaz-brown">Duwaz.</span>
          </div>
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            {/* Standard sign in */}
            <Button
              type="submit"
              className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90"
              disabled={isLoading}
              onClick={() => setAdminMode(false)}
            >
              {isLoading && !adminMode ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Divider */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Admin sign in */}
            <Button
              type="submit"
              variant="outline"
              className="w-full border-duwaz-brown text-duwaz-brown hover:bg-duwaz-brown hover:text-white"
              disabled={isLoading}
              onClick={() => setAdminMode(true)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {isLoading && adminMode ? 'Signing in...' : 'Sign In as Admin'}
            </Button>

            <p className="text-sm text-center text-muted-foreground pt-1">
              Don't have an account?{' '}
              <Link to="/register" className="text-duwaz-brown hover:underline font-medium">
                Sign Up
              </Link>
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Are you a driver?{' '}
              <Link to="/driver/login" className="text-duwaz-brown hover:underline font-medium">
                Driver Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
