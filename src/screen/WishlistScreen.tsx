import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useFocusEffect } from "@react-navigation/native"
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native"
import { FlashList } from "@shopify/flash-list"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { getColors } from "../theme/theme"
import Toast from "react-native-toast-message"
import axios from "axios"
import { API_CONFIG } from "../config/api"
import {
  useInfiniteWishlist,
  useInvalidateInfiniteWishlist,
} from "../hooks/query/useInfiniteWishlist"
import ItemList from "../components/Items/ItemList"
import AddToCartModal from "../components/Items/AddToCartModal"
import MultipleItemsCartModal from "../components/Items/MultipleItemsCartModal"
import ConfirmationModal from "../components/ConfirmationModal/ConfirmationModal"
import { ChatBotIcon } from "../components/ChatBot"
import styles from "../styles/WishlistScreen.styles"

interface WishlistItem {
  wishlist_id: number
  product_id: number
  date_added: string
  product: {
    id: number
    name: string
    brand: string
    image: string
    priceSrp: number
    priceMember: number
    avgRating: number
    qty: number
    prodpv: number
  }
}

interface WishlistScreenProps {
  token?: string | null
  wishlistItems: WishlistItem[]
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  onProductPress?: (id: number) => void
  onCartUpdate?: () => void
  onNavigateToCart?: () => void
  onCheckout?: () => void
  isDarkMode?: boolean
}

export default function WishlistScreen({
  token,
  wishlistItems,
  loading,
  refreshing,
  onRefresh,
  onProductPress,
  onCartUpdate,
  onNavigateToCart,
  onCheckout,
  isDarkMode = false,
}: WishlistScreenProps) {
  const [searchInput, setSearchInput] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  // Optimistically-hidden items (removed/moved-to-cart) until the query refetches.
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [sortOrder, setSortOrder] = useState<"new" | "old">("new")
  const [discountFilter, setDiscountFilter] = useState<"all" | "discount">(
    "all"
  )
  const [showModal, setShowModal] = useState(false)
  const [loadingMultiple, setLoadingMultiple] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<WishlistItem | null>(
    null
  )
  const [showAddToCartModal, setShowAddToCartModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: number
    name: string
  } | null>(null)

  const insets = useSafeAreaInsets()
  // Palette from the centralized theme (slate spine + sky accent).
  const t = getColors(isDarkMode)
  const colors = {
    bg: t.bgSubtle,
    text: t.text,
    textSec: t.textSecondary,
    border: t.border,
    card: t.card,
    hint: isDarkMode ? t.card : "#f9fafb",
  }

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => clearTimeout(id)
  }, [searchInput])

  // Server-side searchable + paginated wishlist (TanStack infinite query).
  const {
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: queryLoading,
    isRefetching,
    refetch,
  } = useInfiniteWishlist({ token, search: debouncedSearch })
  const invalidateWishlistQuery = useInvalidateInfiniteWishlist()

  // Refetch every time the Wishlist tab gains focus, so items added elsewhere
  // (e.g. tapping hearts on the Shop screen) reliably show up here even if the
  // add finished after the last refetch.
  useFocusEffect(
    useCallback(() => {
      setRemovedIds(new Set())
      refetch()
      // refetch is stable across renders for this query instance.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  // Alias so existing handlers keep working; hide optimistically-removed items.
  const wishlist = useMemo(
    () => (items as WishlistItem[]).filter((i) => !removedIds.has(i.wishlist_id)),
    [items, removedIds]
  )

  const handleRefresh = () => {
    setRemovedIds(new Set())
    refetch()
    onRefresh?.()
  }

  const afterMutation = () => {
    invalidateWishlistQuery()
    onRefresh?.()
  }

  const handleSelectItem = (wishlistId: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(wishlistId)) {
      newSelected.delete(wishlistId)
    } else {
      newSelected.add(wishlistId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === wishlist.length) {
      setSelectedItems(new Set())
    } else {
      const allIds = new Set(wishlist.map((item) => item.wishlist_id))
      setSelectedItems(allIds)
    }
  }

  const getSortedWishlist = () => {
    let filtered = wishlist

    // Filter by discount
    if (discountFilter === "discount") {
      filtered = filtered.filter((item) => {
        const discount = Math.round(
          ((item.product.priceSrp - item.product.priceMember) /
            item.product.priceSrp) *
            100
        )
        return discount > 0
      })
    }

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date_added).getTime()
      const dateB = new Date(b.date_added).getTime()
      return sortOrder === "new" ? dateB - dateA : dateA - dateB
    })
  }

  const getSelectedTotal = () => {
    return Array.from(selectedItems).reduce((total, wishlistId) => {
      const item = wishlist.find((w) => w.wishlist_id === wishlistId)
      return total + (item ? item.product.priceMember : 0)
    }, 0)
  }

  const getSelectedItemsForModal = () => {
    return Array.from(selectedItems)
      .map((wishlistId) => wishlist.find((w) => w.wishlist_id === wishlistId))
      .filter((item): item is WishlistItem => item !== undefined)
  }

  const handleAddProductToCart = async (data: {
    product_id: number
    variant_id?: number
    quantity: number
    selected_color?: string | null
    selected_size?: string | null
    selected_type?: string | null
  }) => {
    if (!token) return
    try {
      console.log("Add to cart data received:", data)

      const cartData: any = {
        product_id: data.product_id,
        quantity: data.quantity,
      }

      // Only include variant_id if it exists and is not null
      if (data.variant_id) {
        cartData.variant_id = data.variant_id
      }

      // Include variant details if they exist
      if (data.selected_color) {
        cartData.selected_color = data.selected_color
      }
      if (data.selected_size) {
        cartData.selected_size = data.selected_size
      }
      if (data.selected_type) {
        cartData.selected_type = data.selected_type
      }

      console.log("Sending to API:", cartData)

      // Add to cart
      await axios.post(`${API_CONFIG.BASE_URL}/cart/add`, cartData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Remove from wishlist since it's moved to cart
      const wishlistItem = wishlist.find(
        (item) => item.product.id === data.product_id
      )
      if (wishlistItem) {
        await axios.delete(
          `${API_CONFIG.BASE_URL}/wishlist/${data.product_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // Optimistically hide it, then refetch the wishlist.
        setRemovedIds((prev) => new Set(prev).add(wishlistItem.wishlist_id))
        afterMutation()

        Toast.show({
          type: "success",
          text1: "Moved to Cart",
          text2: `${data.quantity} item(s) moved from wishlist to cart`,
        })
      } else {
        Toast.show({
          type: "success",
          text1: "Added to Cart",
          text2: `${data.quantity} item(s) added to your cart`,
        })
      }

      setShowAddToCartModal(false)
      setSelectedProduct(null)
      setQuantity(1)
      setSelectedVariant(null)
      onCartUpdate?.()
    } catch (error: any) {
      console.error("Error adding to cart:", error)
      console.error("Error response:", error?.response?.data)
      console.error("Error status:", error?.response?.status)
      console.error("Error headers:", error?.response?.headers)

      let errorMessage = "Failed to add item to cart"

      // Check for specific database errors
      if (
        error?.response?.data?.error?.includes("column") &&
        error?.response?.data?.error?.includes("does not exist")
      ) {
        errorMessage =
          "Server database error. Please try again later or contact support."
      } else if (error?.response?.data?.message) {
        errorMessage = error?.response?.data?.message
      }

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      })
    }
  }

  const handleAddMultipleToCart = async (
    items: Array<{
      product_id: number
      quantity: number
      variant_id?: number
      selected_color?: string | null
      selected_size?: string | null
      selected_type?: string | null
    }>
  ) => {
    if (!token) return
    try {
      setLoadingMultiple(true)

      // Add items to cart using bulk-add endpoint
      await axios.post(
        `${API_CONFIG.BASE_URL}/cart/bulk-add`,
        { items },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Remove items from wishlist
      const wishlistIdsToRemove: number[] = []
      items.forEach((item) => {
        const wishlistItem = wishlist.find(
          (w) => w.product.id === item.product_id
        )
        if (wishlistItem) {
          wishlistIdsToRemove.push(wishlistItem.wishlist_id)
        }
      })

      // Remove each item from wishlist via API
      for (const item of items) {
        try {
          await axios.delete(
            `${API_CONFIG.BASE_URL}/wishlist/${item.product_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        } catch (error) {
          console.error(
            `Failed to remove product ${item.product_id} from wishlist:`,
            error
          )
        }
      }

      // Optimistically hide them, then refetch the wishlist.
      setRemovedIds((prev) => {
        const next = new Set(prev)
        wishlistIdsToRemove.forEach((id) => next.add(id))
        return next
      })
      afterMutation()

      Toast.show({
        type: "success",
        text1: "Moved to Cart",
        text2: `${items.length} items moved from wishlist to cart`,
      })
      setShowModal(false)
      setSelectedItems(new Set())
      onCartUpdate?.()

      // Navigate to cart screen after successful bulk-add
      setTimeout(() => {
        onNavigateToCart?.()
      }, 500)
    } catch (error: any) {
      console.error("Error adding to cart:", error)
      const errorMessage =
        error?.response?.data?.message || "Failed to add items to cart"
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      })
    } finally {
      setLoadingMultiple(false)
    }
  }

  const removeFromWishlist = (wishlistId: number) => {
    if (deletingIds.has(wishlistId)) return

    const wishlistItem = wishlist.find(
      (item) => item.wishlist_id === wishlistId
    )
    const productName = wishlistItem?.product.name || "Item"

    setItemToDelete({ id: wishlistId, name: productName })
    setConfirmDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    const { id: wishlistId, name: productName } = itemToDelete

    try {
      setDeletingIds((prev) => new Set(prev).add(wishlistId))
      setConfirmDeleteModal(false)

      const wishlistItem = wishlist.find(
        (item) => item.wishlist_id === wishlistId
      )
      const productId = wishlistItem?.product.id

      // Call DELETE API to remove from wishlist
      if (token && productId) {
        await axios.delete(`${API_CONFIG.BASE_URL}/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      // Optimistically hide it, then refetch the wishlist.
      setRemovedIds((prev) => new Set(prev).add(wishlistId))
      afterMutation()

      Toast.show({
        type: "success",
        text1: "Removed",
        text2: `${productName} removed from wishlist`,
      })
    } catch (error: any) {
      console.error("Error removing from wishlist:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove item",
      })
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(wishlistId)
        return next
      })
      setItemToDelete(null)
    }
  }

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
    const isDeleting = deletingIds.has(item.wishlist_id)
    return (
      <View
        style={[
          styles.rowWrap,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ItemList
          wishlist_id={item.wishlist_id}
          product_id={item.product_id}
          product={item.product}
          isSelected={selectedItems.has(item.wishlist_id)}
          onProductPress={onProductPress}
          onRemove={removeFromWishlist}
          onSelect={handleSelectItem}
          isDarkMode={isDarkMode}
          onAddToCart={(wishlistId) => {
            const product = wishlist.find((w) => w.wishlist_id === wishlistId)
            if (product) {
              setSelectedProduct(product)
              setShowAddToCartModal(true)
            }
          }}
        />
        {/* Action buttons (replace the old swipe gesture) */}
        <View style={[styles.rowActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.rowActionCart}
            onPress={() => {
              setSelectedProduct(item)
              setShowAddToCartModal(true)
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={16} color={Colors.white} />
            <Text style={styles.rowActionCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rowActionDelete, { borderColor: "#ef4444" }]}
            onPress={() => removeFromWishlist(item.wishlist_id)}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            )}
            <Text style={styles.rowActionDeleteText}>
              {isDeleting ? "Deleting" : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const sortedWishlist = getSortedWishlist()

  // Empty / loading state shown inside the list (keeps the search bar visible).
  const renderEmpty = () => {
    if (queryLoading) {
      return (
        <View style={styles.listStateBox}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      )
    }
    return (
      <View style={styles.listStateBox}>
        <Ionicons
          name={debouncedSearch ? "search-outline" : "heart-outline"}
          size={64}
          color={colors.textSec}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {debouncedSearch
            ? `No results for "${debouncedSearch}"`
            : "No items in your wishlist"}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSec }]}>
          {debouncedSearch
            ? "Try a different keyword"
            : "Add items to your wishlist to save them for later"}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <View style={[styles.wrapper, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <Text style={[styles.screenTitle, { color: colors.text }]}>
            My Wishlist
          </Text>

          {/* Search within the wishlist (server-side via the infinite query) */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.hint, borderColor: colors.border },
              searchFocused && styles.searchBarFocused,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={searchFocused ? Colors.sky : colors.textSec}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search your wishlist..."
              placeholderTextColor={colors.textSec}
              value={searchInput}
              onChangeText={setSearchInput}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              selectionColor={Colors.sky}
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchInput("")}
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSec}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={handleSelectAll}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.selectAllCheckbox,
                  selectedItems.size > 0 && styles.selectAllCheckboxChecked,
                  selectedItems.size === 0 && { borderColor: colors.border },
                ]}
              >
                {selectedItems.size > 0 && (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                )}
              </View>
              <Text
                style={[
                  styles.selectAllText,
                  selectedItems.size > 0 && styles.selectAllTextActive,
                  {
                    color:
                      selectedItems.size === 0 ? colors.textSec : Colors.sky,
                  },
                ]}
              >
                {selectedItems.size > 0
                  ? `${selectedItems.size} selected`
                  : "Select All"}
              </Text>
            </TouchableOpacity>

            <View style={styles.filterSection}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  sortOrder === "new" && styles.filterBtnActive,
                  sortOrder !== "new" && {
                    backgroundColor: isDarkMode ? "#1e293b" : "#f3f4f6",
                  },
                ]}
                onPress={() => setSortOrder("new")}
              >
                <Text
                  style={[
                    styles.filterText,
                    sortOrder === "new" && styles.filterTextActive,
                    sortOrder !== "new" && { color: colors.text },
                  ]}
                >
                  New
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  sortOrder === "old" && styles.filterBtnActive,
                  sortOrder !== "old" && {
                    backgroundColor: isDarkMode ? "#1e293b" : "#f3f4f6",
                  },
                ]}
                onPress={() => setSortOrder("old")}
              >
                <Text
                  style={[
                    styles.filterText,
                    sortOrder === "old" && styles.filterTextActive,
                    sortOrder !== "old" && { color: colors.text },
                  ]}
                >
                  Old
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  discountFilter === "discount" && styles.filterBtnActive,
                  discountFilter !== "discount" && {
                    backgroundColor: isDarkMode ? "#1e293b" : "#f3f4f6",
                  },
                ]}
                onPress={() =>
                  setDiscountFilter(
                    discountFilter === "discount" ? "all" : "discount"
                  )
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    discountFilter === "discount" && styles.filterTextActive,
                    discountFilter !== "discount" && { color: colors.text },
                  ]}
                >
                  On Sale
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FlashList
          data={sortedWishlist}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.wishlist_id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={Colors.sky} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={handleRefresh}
              colors={[Colors.sky]}
              tintColor={isDarkMode ? "#fff" : Colors.sky}
            />
          }
        />

        {selectedItems.size > 0 && (
          <View
            style={[
              styles.footer,
              { backgroundColor: colors.card, borderTopColor: colors.border },
            ]}
          >
            <View style={styles.totalSection}>
              <Text style={[styles.totalLabel, { color: colors.textSec }]}>
                Total ({selectedItems.size}):
              </Text>
              <Text style={[styles.totalPrice, { color: colors.text }]}>
                ₱{getSelectedTotal().toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, loadingMultiple && { opacity: 0.6 }]}
              onPress={() => setShowModal(true)}
              disabled={loadingMultiple}
            >
              <Text style={styles.checkoutBtnText}>Add Selected to Cart</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <MultipleItemsCartModal
            visible={showModal}
            items={getSelectedItemsForModal()}
            onClose={() => setShowModal(false)}
            onAddToCart={handleAddMultipleToCart}
            loading={loadingMultiple}
            token={token}
            onNavigateToCart={onNavigateToCart}
          />
        </Modal>

        <Modal
          visible={showAddToCartModal}
          transparent
          animationType="none"
          onRequestClose={() => {
            setShowAddToCartModal(false)
            setSelectedProduct(null)
            setQuantity(1)
            setSelectedVariant(null)
          }}
        >
          {selectedProduct && (
            <AddToCartModal
              visible={showAddToCartModal}
              product={{
                id: selectedProduct.product.id,
                name: selectedProduct.product.name,
                brand: selectedProduct.product.brand,
                image: selectedProduct.product.image,
                priceMember: selectedProduct.product.priceMember,
                priceSrp: selectedProduct.product.priceSrp,
                prodpv: selectedProduct.product.prodpv,
                qty: selectedProduct.product.qty,
                soldCount: 0,
                variants: (selectedProduct.product as any).variants || [],
              }}
              images={[
                selectedVariant
                  ? (selectedProduct.product as any).variants?.find(
                      (v: any) => v.id === selectedVariant
                    )?.images?.[0] ||
                    selectedProduct.product.image ||
                    ""
                  : selectedProduct.product.image || "",
              ]}
              selectedVariant={selectedVariant}
              quantity={quantity}
              isDarkMode={isDarkMode}
              onClose={() => {
                setShowAddToCartModal(false)
                setSelectedProduct(null)
                setQuantity(1)
                setSelectedVariant(null)
              }}
              onSelectVariant={setSelectedVariant}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddProductToCart}
              onCheckout={onCheckout}
              onProductPress={(productId) => {
                setShowAddToCartModal(false)
                setSelectedProduct(null)
                setQuantity(1)
                setSelectedVariant(null)
                onProductPress?.(productId)
              }}
            />
          )}
        </Modal>

        {/* Confirmation Delete Modal */}
        <ConfirmationModal
          visible={confirmDeleteModal}
          title="Remove from Wishlist"
          message={`Are you sure you want to remove "${itemToDelete?.name}" from your wishlist?`}
          confirmText="Remove"
          cancelText="Cancel"
          isDestructive={true}
          isDarkMode={isDarkMode}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setConfirmDeleteModal(false)
            setItemToDelete(null)
          }}
        />
      </View>

      {/* Chat Bot Icon */}
      <ChatBotIcon
        position="bottom-right"
        visible={true}
        isDarkMode={isDarkMode}
      />
    </View>
  )
}
