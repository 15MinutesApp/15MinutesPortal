export type SubInterest = {
  id: string;
  name: string;
  nameEn: string;
  logo?: string;
  userCount: number;
  isActive: boolean;
};

export type InterestCategory = {
  id: string;
  name: string;
};

export type Interest = {
  id: string;
  name: string;
  thumbnail?: string;
  userCount: number;
  isActive: boolean;
  interestCategory?: InterestCategory;
  subInterests?: Interest[]; // Alt kategoriler de Interest type'ı olacak
};
