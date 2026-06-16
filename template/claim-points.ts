import * as consts from '../consts';

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