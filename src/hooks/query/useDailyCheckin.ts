import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  rewardsService,
  type DailyCheckinBoard,
  type CheckinResult,
} from "../../services/rewardsService"

const CHECKIN_KEY = ["daily-checkin"] as const

/** Read-only board state (GET) — draws the check-in screen. */
export const useDailyCheckin = (token?: string | null, enabled = true) => {
  return useQuery<DailyCheckinBoard>({
    queryKey: [...CHECKIN_KEY, token],
    queryFn: async () => {
      if (!token) throw new Error("Token is required")
      return rewardsService.getDailyCheckin(token)
    },
    enabled: !!token && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Claim today's check-in (POST). On success, invalidates the board so the
 * server's updated streak / claimed-days / can_check_in state is re-fetched.
 */
export const useClaimDailyCheckin = (token?: string | null) => {
  const queryClient = useQueryClient()
  return useMutation<CheckinResult, any, void>({
    mutationFn: async () => {
      if (!token) throw new Error("Token is required")
      return rewardsService.claimDailyCheckin(token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHECKIN_KEY })
    },
  })
}
