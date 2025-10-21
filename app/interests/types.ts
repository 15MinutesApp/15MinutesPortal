export type SubInterest = {
  id: string;
  name: string;
  nameEn: string;
  logo?: string;
  userCount: number;
};

export type Interest = {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  thumbnail?: string;
  userCount: number;
  subInterests: SubInterest[];
};
