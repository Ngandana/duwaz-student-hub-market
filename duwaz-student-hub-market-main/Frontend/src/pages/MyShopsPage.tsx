import { Link, useNavigate } from 'react-router-dom';
import { Plus, Store, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useShopContext } from '@/context/ShopContext';
import type { Business } from '@/types';

const MyShopsPage = () => {
  const { myShops, isLoadingShop } = useShopContext();
  const navigate = useNavigate();

  if (isLoadingShop) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted-foreground">Loading your shops...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-duwaz-black">My Shops</h1>
          <p className="text-muted-foreground mt-1">
            {myShops.length === 0
              ? 'You haven\'t created any shops yet.'
              : `You own ${myShops.length} shop${myShops.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <Button
          asChild
          className="bg-duwaz-brown hover:bg-duwaz-brown/90 text-white"
        >
          <Link to="/create-shop">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Shop
          </Link>
        </Button>
      </div>

      {/* No shops state */}
      {myShops.length === 0 && (
        <Card className="border-dashed border-2 text-center py-16">
          <CardContent>
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No shops yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first shop to start selling products.
            </p>
            <Button asChild className="bg-duwaz-brown hover:bg-duwaz-brown/90 text-white">
              <Link to="/create-shop">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Shop
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shop cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myShops.map((shop: Business) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </div>
  );
};

const ShopCard = ({ shop }: { shop: Business }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Logo or placeholder */}
            <div className="w-12 h-12 rounded-lg bg-duwaz-brown/10 flex items-center justify-center flex-shrink-0">
              {shop.logoUrl ? (
                <img
                  src={shop.logoUrl}
                  alt={shop.businessName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <Store className="h-6 w-6 text-duwaz-brown" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{shop.businessName}</CardTitle>
              {shop.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {shop.description}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs ml-2 flex-shrink-0">
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          {/* Manage (go to shop dashboard) */}
          <Button
            asChild
            size="sm"
            className="flex-1 bg-duwaz-brown hover:bg-duwaz-brown/90 text-white"
          >
            <Link to={`/my-shop/${shop.id}`}>
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Manage
            </Link>
          </Button>
          {/* View public shop page */}
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link to={`/shop/${shop.id}`}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyShopsPage;
