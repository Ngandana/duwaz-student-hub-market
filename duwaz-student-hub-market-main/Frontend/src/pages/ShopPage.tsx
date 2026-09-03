import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Settings, Phone, Clock, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/hooks/useBusinesses';
import { useBusinessProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';

const ShopPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { user } = useAuth();

  const shopId = Number(id);
  const { data: shop, isLoading: shopLoading, isError: shopError } = useBusiness(shopId);
  const { data: products = [], isLoading: productsLoading } = useBusinessProducts(shopId);

  // Check if the logged-in user is the owner
  const isOwner = !!user && shop?.student?.id === user.userId;

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.imageUrl ?? '/placeholder.svg',
      shopName: shop?.businessName ?? '',
      shopId: shop?.id,
    });
    toast({ title: 'Added to cart', description: `${product.name} has been added to your cart.`, duration: 3000 });
  };

  if (shopLoading) {
    return (
      <div className="min-h-screen">
        <div className="w-full h-48 bg-gray-200 animate-pulse" />
        <div className="container mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
          <div className="h-24 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Shop not found</h1>
        <p className="mb-6">The shop you're looking for doesn't exist or has been removed.</p>
        <Button asChild><Link to="/marketplace">Back to Marketplace</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-4">
        <Link to="/marketplace" className="flex items-center text-duwaz-brown hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to marketplace
        </Link>
        {isOwner && (
          <Button asChild variant="outline" size="sm">
            <Link to="/my-shop">
              <Settings className="h-4 w-4 mr-1" /> Manage Shop
            </Link>
          </Button>
        )}
      </div>

      {/* Banner */}
      <div className="w-full h-48 bg-gradient-to-r from-duwaz-brown/20 to-duwaz-brown/40 flex items-center justify-center mt-4">
        <Store className="h-16 w-16 text-duwaz-brown/40" />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Shop Header */}
        <div className="flex flex-col md:flex-row md:items-end mb-8 relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white md:absolute md:-top-16 mb-4 md:mb-0 shadow-md flex items-center justify-center bg-duwaz-brown/10">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.businessName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-duwaz-brown">{shop.businessName.charAt(0)}</span>
            )}
          </div>
          <div className="md:ml-28">
            <h1 className="text-3xl font-bold">{shop.businessName}</h1>
            {shop.student && <p className="text-gray-600 mt-1">Owner: {shop.student.studentName}</p>}
          </div>
        </div>

        {/* About */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">About this shop</h2>
          <p className="text-gray-700">{shop.description ?? 'No description provided.'}</p>
        </div>

        {/* Shop details: category, contact, hours */}
        {(shop.shopCategory || shop.phoneNumber || shop.operatingHours) && (
          <div className="mb-8 grid sm:grid-cols-3 gap-4">
            {shop.shopCategory && (
              <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                <Tag className="h-4 w-4 text-duwaz-brown mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="text-sm font-medium">{shop.shopCategory}</p>
                </div>
              </div>
            )}
            {shop.phoneNumber && (
              <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                <Phone className="h-4 w-4 text-duwaz-brown mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Contact</p>
                  <a href={`tel:${shop.phoneNumber}`} className="text-sm font-medium hover:underline">{shop.phoneNumber}</a>
                </div>
              </div>
            )}
            {shop.operatingHours && (
              <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 sm:col-span-1">
                <Clock className="h-4 w-4 text-duwaz-brown mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Hours</p>
                  <p className="text-sm font-medium whitespace-pre-line">{shop.operatingHours}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Products ({products.length})</h2>
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  image={product.imageUrl}
                  shopName={shop.businessName}
                  shopId={shop.id}
                  stockQuantity={product.stockQuantity}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                {isOwner
                  ? 'You haven\'t added any products yet.'
                  : 'This shop doesn\'t have any products yet.'}
              </p>
              {isOwner && (
                <Button asChild className="mt-4 bg-duwaz-brown hover:bg-duwaz-brown/90">
                  <Link to="/my-shop">Add Products</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
