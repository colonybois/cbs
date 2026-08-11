export type UserRole = "super_admin" | "admin" | "member";
export type UserStatus = "pending" | "active" | "rejected" | "blocked" | "suspended";
export type ChandaStatus = "pending_handover" | "settled";
export type OnlinePaymentStatus = "pending" | "approved" | "rejected";
export type PaymentMode = "cash" | "upi";

export type ComityDesignation =
  | "President"
  | "Vice President"
  | "Secretary"
  | "Treasurer"
  | "General Secretary"
  | "Event Coordinator"
  | "Decoration Coordinator"
  | "Cultural Coordinator"
  | "Chanda Coordinator"
  | "Volunteer Coordinator"
  | "Committee Member";

export interface ComityMember {
  id: string;
  fullName: string;
  designation: ComityDesignation;
  memberSince: string;
  bio: string;
  photoUrl: string;
  publicContact: string;
  showContact: boolean;
  featured: boolean;
  active: boolean;
  publicVisible: boolean;
  displayOrder: number;
  createdBy: string;
  createdAt: { toDate?: () => Date } | string | null;
  updatedAt: { toDate?: () => Date } | string | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}
export interface ChandaCollection {
  id: string;
  collectedByUid: string;
  collectedByName: string;
  residentName: string;
  houseOrFlatNo: string;
  phone: string;
  amount: number;
  paymentMode: PaymentMode;
  status: ChandaStatus;
  settledByAdmin?: string;
  settledAt?: string;
  createdAt: string;
}
export interface OnlineChandaSubmission {
  id: string;
  residentName: string;
  phone: string;
  amount: number;
  screenshotUrl: string;
  status: OnlinePaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}
export type EventCategory =
  "Pooja & Harathi" | "Cultural Activities & Competitions" | "Major Ceremonies";
export interface PandalEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  timeSlot?: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  category?: EventCategory;
  imageUrl?: string;
  prasadam?: string;
  coordinator?: string;
  sponsor?: string;
  coHost?: string;
  announcements?: string;
  featured?: boolean;
  published?: boolean;
  status?: "upcoming" | "completed";
  createdAt: string;
}
export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  year: number;
  relatedEvent?: string;
  credit?: string;
  featured?: boolean;
  slideOrderIndex: number;
  status: "published" | "hidden";
  uploadedBy: string;
  createdAt: string;
}
export interface Member {
  id: string;
  name: string;
  area: string;
  phone: string;
  balance: number;
  total: number;
  status: "Active" | "Offline";
}
export interface Donation {
  id: string;
  donor: string;
  phone: string;
  amount: number;
  method: "UPI" | "Cash";
  status: "Verified" | "Pending" | "Settled";
  date: string;
  collector?: string;
}
