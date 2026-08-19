import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ShopCard from '@/components/ShopCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';

const MarketplacePage = () => {
  const { toast } = useToast();
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [activeTab, setActiveTab] = useState('products');

  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: businesses = [], isLoading: businessesLoading } = useBusinesses();

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.imageUrl ?? '/placeholder.svg',
      shopName: product.business?.businessName ?? product.category?.name ?? '',
      shopId: product.business?.id,
    });
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
      duration: 3000,
    });
  };

  // Filter products by search term and selected category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      String(product.category?.id) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter businesses by search term
  const filteredBusinesses = businesses.filter(
    (b) =>
      b.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sync selected category to URL
  useEffect(() => {
    if (selectedCategory === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', selectedCategory);
    }
    setSearchParams(searchParams);
  }, [selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search products or shops..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="relative inline-block w-full md:w-auto">
            <select
              className="w-full md:w-auto appearance-none bg-white border rounded-md py-2 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-duwaz-brown"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          <div
            className={`rounded-full px-4 py-2 text-sm cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-duwaz-brown text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </div>
          {categories.map((category) => (
            <div
              key={category.id}
              className={`rounded-full px-4 py-2 text-sm cursor-pointer transition-colors ${
                selectedCategory === String(category.id)
                  ? 'bg-duwaz-brown text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(String(category.id))}
            >
              {category.name}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="shops">Student Shops</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  image={product.imageUrl}
                  shopName={product.business?.businessName ?? product.category?.name}
                  shopId={product.business?.id}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No products found matching your criteria.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shops">
          {businessesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((shop) => (
                <ShopCard
                  key={shop.id}
                  id={shop.id}
                  name={shop.businessName}
                  logo={shop.logoUrl}
                  description={shop.description ?? ''}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No shops found matching your search.</p>
              <Button variant="link" onClick={() => setSearchTerm('')}>
                Clear search
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplacePage;
