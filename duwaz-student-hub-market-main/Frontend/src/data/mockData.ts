
// Mock data for the Duwaz marketplace

// Categories
export const categories = [
  {
    id: "snacks",
    name: "Snacks",
    image: "/placeholder.svg",
    productCount: 24,
    description: "Student-made and branded snacks for all your cravings.",
  },
  {
    id: "bread",
    name: "Bread & Baked Goods",
    image: "/placeholder.svg",
    productCount: 18,
    description: "Freshly baked bread and pastries from campus bakeries.",
  },
  {
    id: "clothing",
    name: "Clothing",
    image: "/placeholder.svg",
    productCount: 36,
    description: "Stylish and affordable clothing items and accessories.",
  },
  {
    id: "essentials",
    name: "Daily Essentials",
    image: "/placeholder.svg",
    productCount: 42,
    description: "Everything you need for your daily student life.",
  }
];

// Shops
export const shops = [
  {
    id: "snack-haven",
    name: "Snack Haven",
    logo: "/placeholder.svg",
    banner: "/placeholder.svg",
    description: "Your one-stop shop for delicious student-made snacks and treats.",
    contactEmail: "snacks@snackhaven.co.za",
    location: "East Campus",
    productCount: 12,
    ownerName: "Thabo Nkosi",
    dateJoined: "2023-08-15"
  },
  {
    id: "campus-bakery",
    name: "Campus Bakery",
    logo: "/placeholder.svg",
    banner: "/placeholder.svg",
    description: "Providing fresh bread, rolls, and pastries made by students.",
    contactEmail: "hello@campusbakery.co.za",
    location: "Central Campus",
    productCount: 8,
    ownerName: "Lerato Molefe",
    dateJoined: "2023-06-22"
  },
  {
    id: "student-threads",
    name: "Student Threads",
    logo: "/placeholder.svg",
    banner: "/placeholder.svg",
    description: "Quality student-designed clothing, socks, and accessories.",
    contactEmail: "info@studentthreads.co.za",
    location: "West Campus",
    productCount: 16,
    ownerName: "Busi Ndlovu",
    dateJoined: "2023-09-05"
  },
  {
    id: "campus-essentials",
    name: "Campus Essentials",
    logo: "/placeholder.svg",
    banner: "/placeholder.svg",
    description: "All the daily essentials you need, created by fellow students.",
    contactEmail: "help@campusessentials.co.za",
    location: "North Campus",
    productCount: 24,
    ownerName: "David Okafor",
    dateJoined: "2023-07-10"
  }
];

// Products
export const products = [
  // Snacks
  {
    id: 101,
    name: "Cheese Chips",
    description: "Crispy potato chips with a rich cheese flavor. Perfect for study sessions.",
    price: 15,
    category: "snacks",
    shopId: "snack-haven",
    shopName: "Snack Haven",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.5,
    reviews: 28
  },
  {
    id: 102,
    name: "Chocolate Bar",
    description: "Smooth milk chocolate bar with crunchy nuts. Great energy boost!",
    price: 12,
    category: "snacks",
    shopId: "snack-haven",
    shopName: "Snack Haven",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.8,
    reviews: 34
  },
  {
    id: 103,
    name: "Dried Fruit Mix",
    description: "Healthy mix of dried apples, mangoes, and raisins. No added sugar.",
    price: 20,
    category: "snacks",
    shopId: "snack-haven",
    shopName: "Snack Haven",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.2,
    reviews: 16
  },
  
  // Bread
  {
    id: 201,
    name: "Whole Wheat Bread",
    description: "Freshly baked whole wheat bread. Perfect for sandwiches or toast.",
    price: 25,
    category: "bread",
    shopId: "campus-bakery",
    shopName: "Campus Bakery",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.7,
    reviews: 41
  },
  {
    id: 202,
    name: "Cheese Rolls (6-pack)",
    description: "Soft rolls with a cheese filling. Great for breakfast or a quick snack.",
    price: 30,
    category: "bread",
    shopId: "campus-bakery",
    shopName: "Campus Bakery",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.6,
    reviews: 23
  },
  {
    id: 203,
    name: "Chocolate Muffins (4-pack)",
    description: "Rich chocolate muffins with chocolate chips. A sweet treat for any time of day.",
    price: 35,
    category: "bread",
    shopId: "campus-bakery",
    shopName: "Campus Bakery",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.9,
    reviews: 37
  },
  
  // Clothing
  {
    id: 301,
    name: "Basic Socks (3-pairs)",
    description: "Comfortable cotton socks for everyday wear. Available in black, white, and gray.",
    price: 40,
    category: "clothing",
    shopId: "student-threads",
    shopName: "Student Threads",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.4,
    reviews: 19
  },
  {
    id: 302,
    name: "Campus T-Shirt",
    description: "Stylish cotton t-shirt with a campus-inspired design. Available in multiple sizes.",
    price: 120,
    category: "clothing",
    shopId: "student-threads",
    shopName: "Student Threads",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.7,
    reviews: 25
  },
  {
    id: 303,
    name: "Student Beanie",
    description: "Warm knitted beanie perfect for winter days on campus. One size fits all.",
    price: 60,
    category: "clothing",
    shopId: "student-threads",
    shopName: "Student Threads",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.5,
    reviews: 14
  },
  
  // Essentials
  {
    id: 401,
    name: "Notebook Set (3-pack)",
    description: "Set of three lined notebooks with durable covers. Perfect for class notes.",
    price: 45,
    category: "essentials",
    shopId: "campus-essentials",
    shopName: "Campus Essentials",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.6,
    reviews: 31
  },
  {
    id: 402,
    name: "Reusable Water Bottle",
    description: "Eco-friendly 750ml water bottle. Keeps drinks cold for up to 24 hours.",
    price: 85,
    category: "essentials",
    shopId: "campus-essentials",
    shopName: "Campus Essentials",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.8,
    reviews: 42
  },
  {
    id: 403,
    name: "Desk Lamp",
    description: "Adjustable LED desk lamp with three brightness settings. USB charging port included.",
    price: 150,
    category: "essentials",
    shopId: "campus-essentials",
    shopName: "Campus Essentials",
    images: ["/placeholder.svg"],
    inStock: true,
    rating: 4.7,
    reviews: 27
  }
];

// Slide data for homepage
export const slideData = [
  {
    image: "/placeholder.svg",
    title: "Student-Made Snacks",
    description: "Delicious treats created by student entrepreneurs"
  },
  {
    image: "/placeholder.svg",
    title: "Fresh Bread & Baked Goods",
    description: "Freshly baked by students, for students"
  },
  {
    image: "/placeholder.svg",
    title: "Quality Clothing & Socks",
    description: "Student-designed apparel for everyday campus life"
  },
  {
    image: "/placeholder.svg",
    title: "Daily Student Essentials",
    description: "Everything you need for student life"
  }
];

// User profile mock data
export const userProfile = {
  id: 1,
  name: "Sipho Mabaso",
  email: "sipho.m@university.ac.za",
  profileImage: "/placeholder.svg",
  points: 250,
  joinDate: "2023-03-15",
  transactions: [
    {
      id: 10001,
      date: "2025-05-08",
      amount: 85,
      description: "Reusable Water Bottle",
      shop: "Campus Essentials",
      pointsEarned: 9
    },
    {
      id: 10002,
      date: "2025-05-01",
      amount: 45,
      description: "Cheese Chips & Chocolate Bar",
      shop: "Snack Haven",
      pointsEarned: 5
    },
    {
      id: 10003,
      date: "2025-04-22",
      amount: 25,
      description: "Whole Wheat Bread",
      shop: "Campus Bakery",
      pointsEarned: 3
    },
  ],
  pointsHistory: [
    {
      id: 20001,
      date: "2025-05-10",
      points: 50,
      description: "Completed student feedback survey",
      type: "earned"
    },
    {
      id: 20002,
      date: "2025-05-08",
      points: 9,
      description: "Purchase from Campus Essentials",
      type: "earned"
    },
    {
      id: 20003,
      date: "2025-05-05",
      points: 30,
      description: "Redeemed for discount",
      type: "spent"
    }
  ]
};
