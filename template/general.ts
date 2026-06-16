export const general_event = {
    "query": "\n  mutation SendEvents($input: SendSpadeEventsInput!) {\n    sendSpadeEvents(input: $input) {\n      statusCode\n    }\n  }\n",
    "variables": {
        "input": {
            "data": "",
            "repository": "twilight",
            "encoding": "GZIP_B64"
        }
    }
};