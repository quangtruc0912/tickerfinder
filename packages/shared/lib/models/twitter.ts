export interface TwitterUserData {
  id: string;
  name: string;
  username: string;
  location?: string;
  country?: string;
  country_code?: string;
  profile_image_url?: string;
  verified?: boolean;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
}

export interface TwitterUserResponse {
  data?: TwitterUserData;
  error?: string;
}
