import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  followersService,
  type FollowMutationResponse,
} from "../../services/followersService"

interface UseBrandFollowOptions {
  token?: string | null
  brandId?: number
  /** Fetch the public follower count for this brand. Off for list cards that only need the button state. */
  withCount?: boolean
  /** Seed the count (e.g. from a brand payload that already carries followers_count) to avoid a loading flash. */
  initialCount?: number | null
  enabled?: boolean
}

interface ToggleCallbacks {
  onSuccess?: (isFollowing: boolean) => void
  onError?: (message: string) => void
}

const followingKey = (token?: string | null) => ["following", token]
const followerCountKey = (brandId?: number) => [
  "brand-follower-count",
  brandId ?? null,
]

interface ToggleContext {
  prevFollowing?: number[]
  prevCount?: number
}

/**
 * Follow state for a single brand.
 *
 * The set of followed brand IDs (`["following", token]`) is the single source
 * of truth, so every Follow button across the app — Home cards, brand detail —
 * reflects the same state and updates together. `toggleFollow` is optimistic:
 * the button flips instantly, the count adjusts, and both roll back if the
 * request fails. The server's authoritative response reconciles on success.
 */
export const useBrandFollow = ({
  token,
  brandId,
  withCount = true,
  initialCount = null,
  enabled = true,
}: UseBrandFollowOptions) => {
  const queryClient = useQueryClient()

  const followingQuery = useQuery<number[]>({
    queryKey: followingKey(token),
    queryFn: () => followersService.getFollowing(token!),
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  // Public endpoint — loads even for signed-out viewers of a brand store.
  const countQuery = useQuery<number>({
    queryKey: followerCountKey(brandId),
    queryFn: () => followersService.getBrandFollowerCount(brandId!),
    enabled: enabled && withCount && !!brandId,
    initialData: initialCount ?? undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const isFollowing = !!brandId && (followingQuery.data ?? []).includes(brandId)

  const mutation = useMutation<
    FollowMutationResponse,
    any,
    { follow: boolean },
    ToggleContext
  >({
    mutationFn: ({ follow }) =>
      follow
        ? followersService.follow(token!, brandId!)
        : followersService.unfollow(token!, brandId!),
    onMutate: async ({ follow }) => {
      // Stop in-flight refetches from clobbering the optimistic write.
      await queryClient.cancelQueries({ queryKey: followingKey(token) })
      await queryClient.cancelQueries({ queryKey: followerCountKey(brandId) })

      const prevFollowing = queryClient.getQueryData<number[]>(
        followingKey(token)
      )
      const prevCount = queryClient.getQueryData<number>(
        followerCountKey(brandId)
      )

      queryClient.setQueryData<number[]>(followingKey(token), (old) => {
        const set = new Set(old ?? [])
        if (follow) set.add(brandId!)
        else set.delete(brandId!)
        return Array.from(set)
      })

      queryClient.setQueryData<number>(followerCountKey(brandId), (old) => {
        const base = old ?? prevCount ?? 0
        return Math.max(0, base + (follow ? 1 : -1))
      })

      return { prevFollowing, prevCount }
    },
    onError: (_error, _vars, context) => {
      if (context?.prevFollowing !== undefined) {
        queryClient.setQueryData(followingKey(token), context.prevFollowing)
      }
      if (context?.prevCount !== undefined) {
        queryClient.setQueryData(followerCountKey(brandId), context.prevCount)
      }
    },
    onSuccess: (data) => {
      // Reconcile optimistic guesses with the server's authoritative values.
      queryClient.setQueryData<number[]>(followingKey(token), (old) => {
        const set = new Set(old ?? [])
        if (data.is_following) set.add(brandId!)
        else set.delete(brandId!)
        return Array.from(set)
      })
      queryClient.setQueryData(followerCountKey(brandId), data.followers_count)
    },
  })

  const toggleFollow = (callbacks?: ToggleCallbacks) => {
    if (!token || !brandId || mutation.isPending) return
    mutation.mutate(
      { follow: !isFollowing },
      {
        onSuccess: (data) => callbacks?.onSuccess?.(data.is_following),
        onError: (error) =>
          callbacks?.onError?.(error?.message || "Please try again"),
      }
    )
  }

  return {
    isFollowing,
    followersCount: withCount ? (countQuery.data ?? null) : null,
    isStatusLoading: followingQuery.isLoading,
    isCountLoading: withCount ? countQuery.isLoading : false,
    isToggling: mutation.isPending,
    toggleFollow,
  }
}
