export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  price?: number;
  priceUnit?: string;
  duration?: string;
  coverImage?: string;
  isFeatured: boolean;
  isActive: boolean;
  category?: { id: string; name: string; slug: string };
  media?: Media[];
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  tier: string;
  description?: string;
  shortDesc?: string;
  price: number;
  discountPct: number;
  coverImage?: string;
  color?: string;
  isFeatured: boolean;
  maxGuests?: number;
  duration?: string;
  items?: PackageItem[];
  addOns?: PackageAddOn[];
  media?: Media[];
}

export interface PackageItem {
  id: string;
  description: string;
  isIncluded: boolean;
  sortOrder: number;
}

export interface PackageAddOn {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  address?: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  capacity?: number;
  minCapacity?: number;
  pricePerDay?: number;
  amenities?: Record<string, boolean>;
  coverImage?: string;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  media?: Media[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
  user?: { fullName: string; avatar?: string };
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientTitle?: string;
  avatar?: string;
  rating: number;
  content: string;
  eventType?: string;
  isFeatured: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  publishedAt?: string;
  readTime?: number;
  views: number;
  seoTitle?: string;
  seoDesc?: string;
  author?: { fullName: string; avatar?: string };
  category?: { id: string; name: string; slug: string };
  tags?: { tag: { id: string; name: string; slug: string } }[];
  comments?: BlogComment[];
}

export interface BlogComment {
  id: string;
  postId: string;
  parentId?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
  replies?: BlogComment[];
}

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  category?: string;
  media?: Media[];
  _count?: { media: number };
}

export interface Media {
  id: string;
  url: string;
  thumbUrl?: string;
  title?: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  altText?: string;
  width?: number;
  height?: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: unknown[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender?: { id: string; fullName: string; avatar?: string };
  receiver?: { id: string; fullName: string; avatar?: string };
  counterpart?: { id: string; fullName: string; avatar?: string };
}
