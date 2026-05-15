import { create } from "zustand";
import { productsService } from "@/services/products.service";
import { Product } from "@/types/products.types";

type ProductStore = {
  products: Product[];
  loading: boolean;
  error: string | null;

  fetchProducts: () => Promise<void>;
  addProduct: (data: any) => Promise<void>;
  updateProduct: (id: number, data: any) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
};

export const useProductsStore = create<ProductStore>((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });

    try {
      const data = await productsService.getAll();
      set({ products: data });
    } catch (err: any) {
      set({ error: "Failed to fetch products" });
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (data) => {
    const newProduct = await productsService.create(data);

    set((state) => ({
      products: [newProduct, ...state.products],
    }));
  },

  updateProduct: async (id, data) => {
    const updated = await productsService.update(id, data);

    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? updated : p
      ),
    }));
  },

  deleteProduct: async (id) => {
    await productsService.remove(id);

    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },
}));