export const make_info_body = (username: string) => ({
  "operationName": "NielsenContentMetadata",
  "variables": {
    "isCollectionContent": false,
    "isLiveContent": true,
    "isVODContent": false,
    "collectionID": "",
    "login": username,
    "vodID": ""
  },
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "2dbf505ee929438369e68e72319d1106bb3c142e295332fac157c90638968586"
    }
  }
});