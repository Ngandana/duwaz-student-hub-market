import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ImageWithFallback from './ImageWithFallback';

interface ShopCardProps {
  id: string | number;
  name: string;
  logo?: string | null;
  productCount?: number;
  description: string;
  className?: string;
}

const ShopCard: React.FC<ShopCardProps> = ({
  id,
  name,
  logo,
  productCount,
  description,
  className,
}) => {
  return (
    <Link
      to={`/shop/${id}`}
      className={cn(
        'block rounded-lg shadow-md bg-white transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]',
        className
      )}
    >
      <div className="flex p-4 items-center">
        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border bg-gray-100 flex items-center justify-center">
          {logo ? (
            <ImageWithFallback
              src={logo}
              alt={name}
              className="w-full h-full rounded-full"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-400">{name.charAt(0)}</span>
          )}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="font-medium text-lg">{name}</h3>
          {productCount !== undefined && (
            <p className="text-sm text-muted-foreground">{productCount} products</p>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm line-clamp-2 text-gray-600">{description}</p>
      </div>
    </Link>
  );
};

export default ShopCard;
