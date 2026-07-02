export interface Restaurant {
  id: string;
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  websiteUrl: string | null;
  contactHotline: string | null;
  contactSecondaryPhone: string | null;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
    fullAddress?: string;
  };
  coordinates?: {
    latitude: number | null;
    longitude: number | null;
  };
  cuisineTypes: string[];
  priceRange: 'budget' | 'moderate' | 'expensive' | 'luxury';
  capacity: number;
  operatingHours: Record<string, { open: string; close: string; closed: boolean }>;
  logo: string | null;
  coverImage: string | null;
  galleryImages?: string[];
  primaryImage: string | null;
  averagePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  statusMessage?: string | null;
  bookingNotes?: string | null;
  summaryHighlights?: string | null;
  suitableFor?: string[];
  signatureDishes?: string[];
  amenities?: string[];
  policyRules?: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  stats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    averageRating: number;
    totalReviews: number;
  };
  active: boolean;
  featured: boolean;
  hasMenu: boolean;
  hasTableLayout: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  active: boolean;
}

export interface HomeRecommendations {
  restaurantsForYou: Restaurant[];
  menuItemsForYou: MenuItem[];
  popularRestaurants: Restaurant[];
  personalized: boolean;
  fallbackUsed: boolean;
}
