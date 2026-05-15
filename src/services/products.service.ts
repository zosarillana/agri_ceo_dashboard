import api from "@/lib/api";
import { Product, CreateProductDTO } from "@/types/products.types";


export const productsService = {
  async getAll(): Promise<Product[]> {
    const res = await api.get("/api/products");
    return res.data;
  },

  async create(data: CreateProductDTO): Promise<Product> {
    const res = await api.post("/api/products", data);
    return res.data.data;
  },

  async update(id: number, data: Partial<CreateProductDTO>) {
    const res = await api.put(`/api/products/${id}`, data);
    return res.data.data;
  },

  async remove(id: number) {
    await api.delete(`/api/products/${id}`);
  },
};