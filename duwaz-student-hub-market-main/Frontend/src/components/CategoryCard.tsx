import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  id: string | number;
  name: string;
  image?: string;
  productCount?: number;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ id, name, image, productCount, className }) => {
  return (
    <Link to={`/marketplace?category=${id}`} className={cn("category-card block", className)}>
      <div className="aspect-square relative">
        <img
          src={image ?? '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <h3 className="text-white text-xl font-semibold">{name}</h3>
          {productCount !== undefined && (
            <p className="text-white/80 text-sm">{productCount} products</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
