export interface Profile {
  id: string;
  email?: string; 
  name: string;
  surname: string;
  phone_number: string;
  birth_date: string; // ISO
  avatar_url: string;
  location: string;
  gender: boolean | null;
  bio: string;
  updated_at: string;
  created_at?: string; 
}

export interface UpdateProfileRequest {
  name: string;
  surname: string;
  phone_number?: string | null;
  birth_date?: string | null; //  YYYY-MM-DD
  location?: string | null;
  gender?: boolean | null;
  bio?: string | null;
}

