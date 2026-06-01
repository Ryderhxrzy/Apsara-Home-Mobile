import axios from 'axios';
import { MEILI_CONFIG } from '../config/api';

export interface MeilisearchHit {
  id: number;
  name: string;
  brand?: string | number;
  brand_name?: string;
  price?: number;
  priceSrp?: number;
  priceMember?: number;
  image?: string;
  prodpv?: number | string;
  qty?: number;
  description?: string;
  original_price?: number;
  discounted_price?: number;
  pv?: number | string;
  badges?: {
    variant_count?: number;
    musthave?: boolean;
    bestseller?: boolean;
  };
  has_discount?: boolean;
}

export interface LiveSearchItem {
  id: number;
  name: string;
  original_price: number;
  discounted_price: number;
  pv: number;
  image: string;
  has_discount: boolean;
  discount_percentage: number;
}

export interface ProductCard {
  id: number;
  name: string;
  image: string;
  soldCount: number;
  originalPrice: number;
  memberPrice: number;
  pv: number;
  brandName: string;
  variantCount: number;
  badges: {
    musthave: boolean;
    bestseller: boolean;
    salespromo: boolean;
  };
}

const client = axios.create({
  baseURL: MEILI_CONFIG.HOST,
  headers: {
    'Authorization': `Bearer ${MEILI_CONFIG.SEARCH_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface BrandResult {
  id: number;
  name: string;
  image: string;
}

export const meilisearchService = {
  async liveSearch(query: string, limit: number = 10): Promise<LiveSearchItem[]> {
    try {
      if (!query.trim() || query.trim().length < 2) {
        return [];
      }

      const response = await client.post('/indexes/products/search', {
        q: query.trim(),
        limit,
      });

      const hits = response.data?.results || response.data?.hits || [];
      return hits.map((hit: MeilisearchHit) => ({
        id: hit.id,
        name: hit.name,
        original_price: hit.priceSrp || hit.original_price || 0,
        discounted_price: hit.price || hit.discounted_price || 0,
        pv: parseFloat(String(hit.prodpv || hit.pv || 0)),
        image: hit.image || '',
        has_discount: (hit.priceSrp || hit.original_price || 0) > (hit.price || hit.discounted_price || 0),
        discount_percentage: Math.round(
          (1 - (hit.price || hit.discounted_price || 0) / (hit.priceSrp || hit.original_price || 1)) * 100
        ),
      }));
    } catch (error) {
      console.error('Meilisearch live search error:', error);
      return [];
    }
  },

  async searchProducts(query: string, limit: number = 20): Promise<ProductCard[]> {
    try {
      if (!query.trim() || query.trim().length < 2) {
        return [];
      }

      const response = await client.post('/indexes/products/search', {
        q: query.trim(),
        limit,
      });

      const hits = response.data?.hits || [];
      return hits.map((item: MeilisearchHit) => {
        const brandName = item.brand_name || (item.brand ? String(item.brand) : '');
        return {
          id: item.id,
          name: item.name,
          image: item.image || '',
          soldCount: 0,
          originalPrice: item.priceSrp || item.original_price || 0,
          memberPrice: item.priceMember || item.price || item.discounted_price || 0,
          pv: parseFloat(String(item.prodpv || item.pv || 0)),
          brandName,
          variantCount: item.badges?.variant_count ?? 0,
          badges: {
            musthave: item.badges?.musthave ?? false,
            bestseller: item.badges?.bestseller ?? false,
            salespromo: (item.priceSrp || item.original_price || 0) > (item.price || item.discounted_price || 0),
          },
        };
      });
    } catch (error) {
      console.error('Meilisearch product search error:', error);
      return [];
    }
  },
};
