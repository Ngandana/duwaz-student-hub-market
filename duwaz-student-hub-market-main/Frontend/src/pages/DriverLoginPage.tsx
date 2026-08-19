import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { driverAuthApi } from '@/services/api';

const DriverLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await driverAuthApi.login(formData);
      login(response.token, {
        userId: response.driverId,
        studentName: `${response.firstName} ${response.lastName}`,
        email: response.email,
        role: 'DRIVER',
        driverId: response.driverId,
        driverStatus: response.status,
      });
      toast({ title: 'Welcome!', description: `Signed in as ${response.firstName}` });
      navigate('/driver', { replace: true });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      {/* Back to home */}
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
            <div className="bg-duwaz-brown/10 rounded-full p-3">
              <Truck className="h-8 w-8 text-duwaz-brown" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Driver Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in to your delivery driver account
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
                placeholder="driver@example.com"
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
            <Button
              type="submit"
              className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90"
              disabled={isLoading}
            >
              <Truck className="mr-2 h-4 w-4" />
              {isLoading ? 'Signing in...' : 'Sign In as Driver'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Not a driver?{' '}
              <Link to="/login" className="text-duwaz-brown hover:underline font-medium">
                Customer Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default DriverLoginPage;
