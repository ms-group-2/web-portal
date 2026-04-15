export interface BookingListing {
  id: string;
  title: string;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
  location: string;
  distance?: string;
  price: number;
  priceUnit: string;
  host: string;
  verified: boolean;
  featured?: boolean;
  guests?: number;
  beds?: number;
  instantBook?: boolean;
}

export interface BookingCategory {
  nameKey: string;
  icon: string;
}

export interface HeroSlide {
  image: string;
  titleKey: string;
  subtitleKey: string;
  buttonKey: string;
}

export interface TrendingDestination {
  nameKey: string;
  count: number;
  image: string;
  trend: string;
}

export interface FeaturedHost {
  name: string;
  avatar: string;
  venue: string;
  rating: number;
  reviews: number;
  verified: boolean;
}

export interface GuestReview {
  user: string;
  avatar: string;
  rating: number;
  textKey: string;
  venueKey: string;
  dateKey: string;
}

export interface BookingFeature {
  icon: string;
  titleKey: string;
  descriptionKey: string;
}
