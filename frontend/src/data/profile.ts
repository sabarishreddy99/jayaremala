import profileJson from "@/data/knowledge/profile.json";

export interface Profile {
  name: string;
  tagline: string;
  bio: string;
  email: string;
  phone: string;
  previous: string;
  github: string;
  linkedin: string;
  location: string;
  obsession: string;
  resume: string;
}

export const profile = profileJson as Profile;
