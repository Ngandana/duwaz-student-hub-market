import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";

const Index = () => {
  const { data: categories = [], isLoading } = useCategories();
  const mainCategories = categories.slice(0, 3);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Welcome to Duwaz</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Your marketplace for student essentials. Click below to start shopping!
        </p>

        {/* Category Buttons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {mainCategories.map((category) => (
              <Link
                key={category.id}
                to={`/marketplace?category=${category.id}`}
                className="group block"
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400">
                    {category.name.charAt(0)}
                  </span>
                </div>
                <Button size="lg" className="w-full">
                  Shop {category.name}
                </Button>
              </Link>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="mt-8">
          <Button asChild variant="outline" size="lg">
            <Link to="/marketplace">View All Categories</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
