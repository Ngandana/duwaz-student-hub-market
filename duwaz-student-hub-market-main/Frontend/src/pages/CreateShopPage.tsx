import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Clock, Phone, Store, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateBusiness } from '@/hooks/useCreateBusiness';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useShopContext } from '@/context/ShopContext';

// Predefined shop categories
const SHOP_CATEGORIES = [
  'Food & Drinks',
  'Snacks & Confectionery',
  'Fresh Produce',
  'Clothing & Apparel',
  'Electronics & Accessories',
  'Books & Stationery',
  'Health & Beauty',
  'Home & Living',
  'Sports & Fitness',
  'Art & Crafts',
  'Services',
  'Other',
];

// Days for operating hours builder
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateShopPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutate: createBusiness, isPending } = useCreateBusiness();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMyShops, myShops } = useShopContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    shopCategory: '',
    phoneNumber: '',
  });

  // Operating hours: per-day open/close + closed toggle
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(DAYS.map(d => [d, { open: '08:00', close: '17:00', closed: false }]))
  );

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be smaller than 2MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setLogoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleHourChange = (day: string, field: 'open' | 'close', value: string) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleClosedToggle = (day: string) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }));
  };

  // Build a human-readable operating hours string from the per-day config
  const buildOperatingHoursString = (): string => {
    const lines: string[] = [];
    DAYS.forEach(day => {
      const { open, close, closed } = hours[day];
      if (closed) {
        lines.push(`${day}: Closed`);
      } else {
        lines.push(`${day}: ${open} – ${close}`);
      }
    });
    return lines.join('\n');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName.trim()) {
      toast({ title: 'Shop name is required', variant: 'destructive' });
      return;
    }
    if (!formData.shopCategory) {
      toast({ title: 'Please select a shop category', variant: 'destructive' });
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast({ title: 'Owner phone number is required', variant: 'destructive' });
      return;
    }

    const operatingHours = buildOperatingHoursString();

    createBusiness(
      {
        businessName: formData.businessName,
        description: formData.description,
        logoUrl: logoBase64 ?? undefined,
        shopCategory: formData.shopCategory,
        phoneNumber: formData.phoneNumber,
        operatingHours,
        student: user ? ({ id: user.userId } as any) : undefined,
      },
      {
        onSuccess: (createdShop) => {
          setMyShops([...myShops, createdShop]);
          queryClient.invalidateQueries({ queryKey: ['businesses'] });
          toast({
            title: 'Shop created successfully!',
            description: 'Your shop is now live in the marketplace.',
          });
          navigate('/my-shops');
        },
        onError: (err) => {
          toast({
            title: 'Failed to create shop',
            description: err.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Create Your Shop</h1>
      <p className="text-gray-600 mb-8">Start selling your products to the student community</p>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Shop Logo ───────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Store className="h-4 w-4" /> Shop Identity
            </h2>
            <Label className="block mb-2">Shop Logo</Label>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo preview" className="w-24 h-24 rounded-full object-cover border-2 border-duwaz-brown" />
                    <button type="button" onClick={handleRemoveLogo} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center transition-colors">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="mt-1 text-xs text-gray-400">Upload</span>
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Square image, min 200×200px.</p>
                <p>Max 2MB — JPG, PNG or WebP.</p>
                {!logoPreview && (
                  <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => fileInputRef.current?.click()}>
                    Choose Image
                  </Button>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </section>

          {/* ── Basic Info ──────────────────────────────────────── */}
          <section className="space-y-4">
            {/* Shop Name */}
            <div>
              <Label htmlFor="businessName">
                Shop Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="businessName" name="businessName" className="mt-1"
                placeholder="e.g. Snack Haven, Campus Bakery"
                value={formData.businessName} onChange={handleChange} required
              />
            </div>

            {/* Shop Category */}
            <div>
              <Label htmlFor="shopCategory" className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Shop Category <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.shopCategory} onValueChange={val => setFormData(prev => ({ ...prev, shopCategory: val }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {SHOP_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">
                Shop Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description" name="description" className="mt-1 min-h-[100px]"
                placeholder="Tell customers what you sell and what makes your shop special"
                value={formData.description} onChange={handleChange} required
              />
            </div>
          </section>

          {/* ── Contact ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4" /> Contact
            </h2>
            <div>
              <Label htmlFor="phoneNumber">
                Owner Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phoneNumber" name="phoneNumber" type="tel" className="mt-1"
                placeholder="e.g. 071 234 5678"
                value={formData.phoneNumber} onChange={handleChange} required
              />
              <p className="text-xs text-gray-400 mt-1">Customers may use this to contact your shop.</p>
            </div>
          </section>

          {/* ── Operating Hours ─────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Operating Hours
            </h2>
            <div className="space-y-2">
              {DAYS.map(day => (
                <div key={day} className="grid grid-cols-[100px_1fr_1fr_80px] items-center gap-3">
                  {/* Day label */}
                  <span className="text-sm font-medium text-gray-700">{day.slice(0, 3)}</span>

                  {/* Open time */}
                  <Input
                    type="time" value={hours[day].open}
                    onChange={e => handleHourChange(day, 'open', e.target.value)}
                    disabled={hours[day].closed}
                    className="text-sm disabled:opacity-40"
                  />

                  {/* Close time */}
                  <Input
                    type="time" value={hours[day].close}
                    onChange={e => handleHourChange(day, 'close', e.target.value)}
                    disabled={hours[day].closed}
                    className="text-sm disabled:opacity-40"
                  />

                  {/* Closed toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hours[day].closed}
                      onChange={() => handleClosedToggle(day)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-500">Closed</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Set your opening and closing time for each day, or mark days as closed.</p>
          </section>

          {/* ── Submit ──────────────────────────────────────────── */}
          <div className="pt-4 border-t">
            <Button type="submit" className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90" disabled={isPending}>
              {isPending ? 'Creating your shop...' : 'Create Shop'}
            </Button>
          </div>
        </form>
      </div>

      {/* Info section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">What happens after creating your shop?</h2>
        <ol className="list-decimal pl-5 space-y-2 text-gray-700 text-sm">
          <li>Your shop page goes live in the marketplace immediately</li>
          <li>Add products with prices and photos from your shop dashboard</li>
          <li>Manage orders and request deliveries through the dashboard</li>
          <li>Message the admin anytime from your dashboard's Messages tab</li>
        </ol>
      </div>
    </div>
  );
};

export default CreateShopPage;
