import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    studentName: '',
    studentNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    locationAddress: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        studentName: formData.studentName,
        studentNumber: formData.studentNumber,
        email: formData.email,
        password: formData.password,
        locationAddress: formData.locationAddress || undefined,
      });

      register(response.token, {
        userId: response.userId,
        studentName: response.studentName,
        email: response.email,
        role: (response.role ?? 'CUSTOMER') as any,
      });

      toast({ title: 'Account created!', description: `Welcome, ${response.studentName}!` });
      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err.message || 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join the Duwaz marketplace as a student
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Full Name</Label>
              <Input
                id="studentName"
                name="studentName"
                placeholder="Sipho Mabaso"
                value={formData.studentName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentNumber">Student Number</Label>
              <Input
                id="studentNumber"
                name="studentNumber"
                placeholder="ST12345678"
                value={formData.studentNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@university.ac.za"
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
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationAddress">Location Address</Label>
              <Input
                id="locationAddress"
                name="locationAddress"
                placeholder="e.g. Room 204, Res Block B, DUT Campus"
                value={formData.locationAddress}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                Used as your default delivery address. You can update it later.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-duwaz-brown hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
