module.exports = dependencies => async (event, context) => {
    var siteId;
    if (!event.requestContext.authorizer) {
        return errorResponse('authorization not configured', context.awsRequestId);
    }

    if (event.pathParameters !== null) {
        const pathParams = event['pathParameters'];

        if (pathParams['siteId'] !== undefined && pathParams['siteId'] !== null) {

            siteId = pathParams['siteId'];
        }
        else {
            return errorResponse('siteId is invalid', context.awsRequestId);
        }

    }
    else {
        return errorResponse('site Id not provided', context.awsRequestId);
    }

    try {
        var alarmsData = {};

        alarmsData = await fetchAlarmsForSite(siteId, dependencies.ddb);
        const data = await createResponse(siteId, alarmsData.Items);
        return successResponse(data);
    } catch (error) {
        console.error(error);
        return errorResponse(error.message, context.awsRequestId);
    }

};

//this function is used to build the response in case of error
const errorResponse = (errorMessage, awsRequestId) => ({

    "statusCode": 500,
    "body": JSON.stringify({
        error: errorMessage,
        reference: awsRequestId,
    }),
    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

//this function is used to build the response in case of success
const successResponse = (data) => ({

    "statusCode": 200,
    "body": JSON.stringify(data),
    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

// this function is used to query dynamo db and 
// returns in response, all latest active mqa alarms for a particular site.
function fetchAlarmsForSite(siteId, ddb) {

    var params = {
        TableName: 'dev_isr_mqa_alarm',
        KeyConditionExpression: '#v_site_id = :v_siteId',
        FilterExpression: '#v_alarm_currentstate = :v_alarm_currentstate',
        ExpressionAttributeNames: {
            "#v_site_id": "siteId",
            "#v_alarm_currentstate": "alarmCurrentstate"
        },
        ExpressionAttributeValues: {
            ":v_siteId": siteId,
            ":v_alarm_currentstate": 2
        },
       // ScanIndexForward: false
 };
    return ddb.query(params).promise();
}

// this function is used to create response json from data received from dynamo DB.
async function createResponse(siteId, alarmsData) {
    var item = {};
    item.siteId = siteId;
    item.items = await buildAlaramsData(alarmsData);
    // item.items = alarmsData;

    return item;
}

//this funciton used to build response object
function buildAlaramsData(alarmsData) {
    var map = new Map();

    alarmsData.forEach(data => {
        if (map.has(data.alarmCode)) {
            var valueIn = map.get(data.alarmCode);
            var valueIn1 = Date.parse(valueIn.alarmTimestampActivated);
            var valueIn2 = Date.parse(data.alarmTimestampActivated);
            if(valueIn1 <= valueIn2){
                map.set(data.alarmCode, data);
            }
        }
        else {
            map.set(data.alarmCode, data);
        }
    })
    var arr = [];
    var iterator = map.values();
    map.forEach(item => {
        arr.push(iterator.next().value);
    })
    return arr;
}