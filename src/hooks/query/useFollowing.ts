import { useQuery, useQueryClient } from "@tanstack/react-query"
import { followersService } from "../../services/followersService"

interface UseFollowingOptions {
  token?: string | null
  enabled?: boolean
}

/** Brand IDs the current user follows. One call covers follow-state for every brand. */
export const useFollowing = ({
  token,
  enabled = true,
}: UseFollowingOptions) => {
  const queryClient = useQueryClient()

  const query = useQuery<number[]>({
    queryKey: ["following", token],
    queryFn: () => followersService.getFollowing(token!),
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  const invalidateFollowing = async () => {
    await queryClient.invalidateQueries({ queryKey: ["following"] })
  }

  return {
    ...query,
    invalidateFollowing,
  }
}
