import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Star, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProduct } from '@/hooks/useProducts';
import { useProductReviews } from '@/hooks/useReviews';
import { useCart } from '@/context/CartContext';
import ImageWithFallback from '@/components/ImageWithFallback';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const productId = Number(id);
  const { data: product, isLoading, isError } = useProduct(productId);
  const { data: reviews = [] } = useProductReviews(productId);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.imageUrl ?? '/placeholder.svg',
        shopName: product.business?.businessName ?? product.category?.name ?? '',
        shopId: product.business?.id,
      });
    }
    toast({
      title: 'Added to cart',
      description: `${product.name} (${quantity}) has been added to your cart.`,
      duration: 3000,
    });
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  // Average rating calculated from real reviews
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
            <div className="h-24 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Not found / error state
  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/marketplace" className="flex items-center text-duwaz-brown mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to marketplace
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-md aspect-square">
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full"
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          {/* Category */}
          {product.category && (
            <p className="text-sm text-muted-foreground mb-3">
              Category: {product.category.name}
            </p>
          )}

          {/* Rating from real reviews */}
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(averageRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-gray-600">
              {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}{' '}
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          <p className="text-3xl font-bold mb-4">R{Number(product.price).toFixed(2)}</p>

          {/* Stock indicator */}
          {(product.stockQuantity ?? 0) <= 0 ? (
            <p className="text-sm font-medium text-red-600 mb-4">Out of stock</p>
          ) : (product.stockQuantity ?? 0) <= 5 ? (
            <p className="text-sm font-medium text-amber-600 mb-4">Only {product.stockQuantity} left in stock</p>
          ) : null}

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-gray-700">{product.description ?? 'No description available.'}</p>
          </div>

          {/* Quantity + Add to cart */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="font-medium mr-4">Quantity</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-none"
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stockQuantity ?? Infinity)}
                  className="h-10 w-10 rounded-none"
                >
                  +
                </Button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-duwaz-brown hover:bg-duwaz-brown/90"
              onClick={handleAddToCart}
              disabled={(product.stockQuantity ?? 0) <= 0}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {(product.stockQuantity ?? 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review this product.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm p-4 border">
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Number(review.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {new Date(review.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
