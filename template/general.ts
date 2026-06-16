/**
 * @param data GZIP BASE64 encoded event JSON string. May be array of events for bulk OR single object
 * @returns Object for sending to Twitch as event
 */
export const make_general_event = (data: string) => ({
    "query": "\n  mutation SendEvents($input: SendSpadeEventsInput!) {\n    sendSpadeEvents(input: $input) {\n      statusCode\n    }\n  }\n",
    "variables": {
        "input": {
            "data": data,
            "repository": "twilight",
            "encoding": "GZIP_B64"
        }
    }
});