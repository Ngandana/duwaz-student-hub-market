import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const CartPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleRemove = (id: number, name: string) => {
    removeItem(id);
    toast({ title: 'Item removed', description: `${name} removed from cart.` });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/register', { state: { from: { pathname: '/cart' } } });
      toast({ title: 'Create an account first', description: 'You need an account to make a payment.' });
      return;
    }
    setIsCheckingOut(true);

    // Group items by shopId — we send one order per shop
    const businessGroups: Record<string, typeof items> = {};
    items.forEach(item => {
      const key = String(item.shopId ?? 'unknown');
      if (!businessGroups[key]) businessGroups[key] = [];
      businessGroups[key].push(item);
    });

    const shopIds = Object.keys(businessGroups).filter(k => k !== 'unknown');

    if (shopIds.length === 0) {
      toast({ title: 'Checkout failed', description: 'Could not determine which shop these items belong to.', variant: 'destructive' });
      setIsCheckingOut(false);
      return;
    }

    // Create one order per shop, then navigate to the first order's tracking page
    import('@/services/api').then(({ ordersApi }) => {
      const orderPromises = shopIds.map(shopId => {
        const shopItems = businessGroups[shopId];
        const shopSubtotal = shopItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const payload = {
          totalAmount: shopSubtotal,
          status: 'PENDING',
          business: { id: Number(shopId) },
          items: shopItems.map(item => ({
            product: { id: item.id },
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        } as any;
        return ordersApi.create(payload);
      });

      Promise.all(orderPromises)
        .then((createdOrders: any[]) => {
          toast({ title: 'Order placed!', description: 'Track your delivery in real time.' });
          clearCart();
          // Navigate to the first order's tracking page
          navigate(`/order/${createdOrders[0].id}/track`);
        })
        .catch((err: any) => {
          toast({ title: 'Checkout failed', description: err.message, variant: 'destructive' });
        })
        .finally(() => setIsCheckingOut(false));
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/marketplace" className="flex items-center text-duwaz-brown mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to marketplace
      </Link>

      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {items.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
              >
                <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                  <img
                    src={item.image ?? '/placeholder.svg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.shopName}</p>
                    </div>
                    <p className="font-bold">R{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemove(item.id, item.name)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                'Processing...'
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {isAuthenticated ? 'Make Payment' : 'Make Payment'}
                </>
              )}
            </Button>

            {!isAuthenticated && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                You'll be asked to create an account before paying.
              </p>
            )}

            <p className="text-xs text-gray-500 mt-4 text-center">
              By completing this purchase, you agree to our terms and conditions.
            </p>

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold mb-2">Have a promo code?</h3>
              <div className="flex gap-2">
                <Input placeholder="Enter code" className="flex-1" />
                <Button variant="outline">Apply</Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add items from the marketplace to get started</p>
          <Button asChild>
            <Link to="/marketplace">Browse Products</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CartPage;
