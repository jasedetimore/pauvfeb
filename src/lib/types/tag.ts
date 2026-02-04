/**
 * Tag types for Supabase and UI
 */

// Database model matching Supabase tags table
export interface TagDB {
  id: string;
  tag: string;
  photo_url: string | null;
  description: string | null;
  number_of_issuers: number;
  created_at: string;
  updated_at: string;
}

// API/UI model for tags
export interface TagData {
  id: string;
  name: string;
  issuerCount: number;
  marketCap: number;
  description?: string | null;
  photoUrl?: string | null;
}

// API response shape
export interface TagsApiResponse {
  tags: TagData[];
  total: number;
  error?: string;
}
