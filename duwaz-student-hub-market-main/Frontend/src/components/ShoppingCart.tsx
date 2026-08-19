import { X, ShoppingBag, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose }) => {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    if (!isAuthenticated) {
      navigate('/register', { state: { from: { pathname: '/cart' } } });
    } else {
      navigate('/cart');
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2" />
          <h2 className="text-lg font-semibold">Your Cart</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="flex border-b pb-4">
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                <img
                  src={item.image ?? '/placeholder.svg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.shopName}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-semibold">R{item.price.toFixed(2)}</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      -
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Your cart is empty</p>
            <Button variant="link" className="mt-2" onClick={onClose}>
              Continue Shopping
            </Button>
          </div>
        )}
      </div>

      {/* Footer / Checkout */}
      {items.length > 0 && (
        <div className="p-4 border-t">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Subtotal</span>
              <span>R{subtotal.toFixed(2)}</span>
            </div>
          </div>
          <Button
            className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90"
            onClick={handleCheckout}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Make Payment
          </Button>
          {!isAuthenticated && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              You'll be asked to create an account first.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
