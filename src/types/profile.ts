// Profile page view-model types. Built server-side in lib/profile.

export type ProfileTrustCircle = {
  id: string;
  name: string;
  recordDetail: string;
  trust: number;
};

export type ProfileData = {
  displayName: string;
  phone: string | null;
  verified: boolean;
  email: string | null;
  avatarUrl: string | null;
  fallbackInitials: string | null;
  userId: string;
  currentName: string;
  circleCount: number;
  totalOnTime: number;
  totalLate: number;
  trustCircles: ProfileTrustCircle[];
};
