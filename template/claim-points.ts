/**
 * @param channel_id id of streamer, where you collecting points
 * @param claim_id id of collectable present
 * @returns Request object
 * 
 * Request returns:
 * `Example will be here... Oneday...`
 */

export const make_claim_points = (channel_id: string, claim_id: string) => ({
  "operationName": "ClaimCommunityPoints",
  "variables": {
    "input": {
      "channelID": channel_id,
      "claimID": claim_id
    }
  },
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "46aaeebe02c99afdf4fc97c7c0cba964124bf6b0af229395f1f6d1feed05b3d0"
    }
  }
});