export interface Profile {
  id: string;
  name: string;
  surname: string;
  phone_number: string;
  birth_date: string; // ISO
  avatar_url: string;
  location: string;
  gender: boolean | null;
  bio: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  name: string;
  surname: string;
  phone_number?: string; 
  birth_date?: string; //  YYYY-MM-DD
  location: string;
  gender: boolean | null;
  bio: string;
}

