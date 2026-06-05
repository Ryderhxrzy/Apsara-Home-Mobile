import React, { createContext, useContext } from 'react';
import type { ProductCard } from '../services/productService';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar_url?: string;
  badge_name?: string;
  badge_image?: string | any;
  rank?: number;
  monthly_activation?: {
    current_month_pv: number;
    threshold_pv: number;
    remaining_pv: number;
  };
}

interface CategoryItem {
  id: number;
  name: string;
  image?: string | null;
}

interface BrandItem {
  id: number;
  name: string;
  image?: string | null;
}

interface RoomType {
  room_id: number;
  room_name: string;
  image: string;
  count: number;
}

export interface AppContextType {
  // Auth & User
  token: string | null;
  enrichedUser: User | null;
  onLogout?: () => void;

  // Dark Mode
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;

  // Cart & Wishlist
  cartCount: number;
  wishlistItems: any[];
  wishlistLoading: boolean;
  wishlistRefreshing: boolean;
  invalidateWishlist: () => void;
  onWishlistChange: () => void;

  // Home Screen Data
  homeCategories: CategoryItem[];
  setHomeCategories: (cats: CategoryItem[]) => void;
  homeBrands: BrandItem[];
  setHomeBrands: (brands: BrandItem[]) => void;
  homeRoomTypes: RoomType[];
  setHomeRoomTypes: (rooms: RoomType[]) => void;
  homeFeaturedProducts: ProductCard[];
  setHomeFeaturedProducts: (products: ProductCard[]) => void;
  homeLoadingFeatured: boolean;
  setHomeLoadingFeatured: (loading: boolean) => void;
  isInitialHomeDataReady: boolean;
  homeInitialFetchRef: React.MutableRefObject<boolean>;
  refreshHomeData: () => Promise<void>;

  // Navigation State
  activeTab: 'home' | 'wishlist' | 'shop' | 'notification' | 'profile' | 'settings';
  setActiveTab: (tab: 'home' | 'wishlist' | 'shop' | 'notification' | 'profile' | 'settings') => void;
  previousTab: 'home' | 'wishlist' | 'shop' | 'notification' | 'profile' | 'settings';
  setPreviousTab: (tab: 'home' | 'wishlist' | 'shop' | 'notification' | 'profile' | 'settings') => void;

  // Shop Screen State
  selectedRoomId: number | null;
  setSelectedRoomId: (id: number | null) => void;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  selectedBrandId: number | null;
  setSelectedBrandId: (id: number | null) => void;
  selectedBrand: BrandItem | null;
  setSelectedBrand: (brand: BrandItem | null) => void;
  shopSourceIsCart: boolean;
  setShopSourceIsCart: (is: boolean) => void;
  shopSourceIsCheckout: boolean;
  setShopSourceIsCheckout: (is: boolean) => void;
  shopSourceProductId: number | null;
  setShopSourceProductId: (id: number | null) => void;

  // Search & Product Detail
  searchQuery: string | null;
  setSearchQuery: (query: string | null) => void;
  searchVisible: boolean;
  setSearchVisible: (visible: boolean) => void;
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
  previousSearchQuery: string | null;
  setPreviousSearchQuery: (query: string | null) => void;
  searchSourceProductId: number | null;
  setSearchSourceProductId: (id: number | null) => void;

  // PV Earner & Profiles & Settings & Leaderboard
  showPVEarnerFromTab: boolean;
  setShowPVEarnerFromTab: (show: boolean) => void;
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  setShowSettings?: (show: boolean) => void;
  profileDetailsFromTab: boolean;
  setProfileDetailsFromTab: (show: boolean) => void;
  currentProfile: any;
  setCurrentProfile: (profile: any) => void;

  // Referral & Network
  referralNetworkFromTab: boolean;
  setReferralNetworkFromTab: (show: boolean) => void;
  closeReferralNetwork: boolean;
  setCloseReferralNetwork: (close: boolean) => void;
  referralTree: any;
  setReferralTree: (tree: any) => void;

  // Purchases
  purchasesStatus: 'pending' | 'paid' | 'processing' | 'shipped' | 'to_receive' | 'delivered' | 'cancelled' | 'return';
  setPurchasesStatus: (status: any) => void;
  purchasesInitialOrderId: string | undefined;
  setPurchasesInitialOrderId: (id: string | undefined) => void;

  // Linked Accounts
  linkedAccountsRefreshTrigger: number;
  setLinkedAccountsRefreshTrigger: (trigger: number) => void;

  // Shop Product Detail
  showShopProductDetail: boolean;
  setShowShopProductDetail: (show: boolean) => void;
  shopSelectedProductId: number | null;
  setShopSelectedProductId: (id: number | null) => void;

  // Callbacks
  onProductPress: (id: number) => void;
  onCartPress: () => void;
  onSearchPress: () => void;
  onShopByRoomPress: (roomId: number) => void;
  onShopByCategoryPress: (categoryId: number) => void;
  onShopByBrandPress: (brandId: number) => void;
  onShopNavigate: () => void;
  onShowProfileDetails: (show: boolean) => void;
  onShowReferralNetwork: (show: boolean, tree?: any) => void;
  onPurchaseItemClick: (status: string) => void;
  onSecuritySettingsPress: () => void;
  onShowAFWalletOverview: () => void;
  onShowAFWalletVoucher: () => void;
  onShowAFWalletRewards: () => void;
  onShowAFWalletNetwork: () => void;
  handleOpenAffiliateReferralModal: () => void;

  // ChatBot
  chatbotHidden: boolean;
  setChatbotHidden: (hidden: boolean) => void;

  // Optimistic wishlist updates
  handleOptimisticWishlistToggle?: (productId: number, isWishlisted: boolean, productData?: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children, value }: { children: React.ReactNode; value: AppContextType }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}
