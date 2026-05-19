export type Product = {
  id: number;
  name: string;
  slug: string;
  unit: string;
  default_target: number;
  is_active: boolean;
};

export type CreateProductDTO = {
  name: string;
  unit: string;
  default_target: number;
  is_active?: boolean;
};
