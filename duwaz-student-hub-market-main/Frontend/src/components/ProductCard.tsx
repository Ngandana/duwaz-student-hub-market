import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ImageWithFallback from './ImageWithFallback';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  shopName?: string;
  shopId?: string | number;
  stockQuantity?: number;
  onAddToCart?: () => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  shopName,
  shopId,
  stockQuantity,
  onAddToCart,
  className,
}) => {
  const navigate = useNavigate();
  const isOutOfStock = stockQuantity != null && stockQuantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart && !isOutOfStock) onAddToCart();
  };

  const handleShopClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (shopId) navigate(`/shop/${shopId}`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/product/${id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/product/${id}`)}
      className={cn('product-card block cursor-pointer rounded-lg overflow-hidden', className)}
    >
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={image}
          alt={name}
          className={cn('w-full h-full transition-transform duration-300 hover:scale-105', isOutOfStock && 'opacity-50 grayscale')}
        />
        {isOutOfStock && (
          <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-xs font-medium px-2 py-1 rounded-full">
            Out of Stock
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg line-clamp-1">{name}</h3>
        {shopName && (
          <span
            role="link"
            tabIndex={0}
            onClick={handleShopClick}
            onKeyDown={(e) => e.key === 'Enter' && handleShopClick(e as any)}
            className="text-sm text-muted-foreground hover:text-duwaz-brown transition-colors cursor-pointer"
          >
            {shopName}
          </span>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="font-bold">R{Number(price).toFixed(2)}</p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingBag className="h-4 w-4 mr-1" /> {isOutOfStock ? 'Sold Out' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
