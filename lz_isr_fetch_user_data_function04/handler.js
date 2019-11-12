module.exports = dependencies => async (event, context) => {
    var userId;
    if (!event.requestContext.authorizer) {
        return errorResponse('authorization not configured', context.awsRequestId);

    }

    if (event.requestContext.authorizer.claims !== null) {
        const requestClaimObject = event.requestContext.authorizer.claims;

        if (requestClaimObject.email !== undefined && requestClaimObject.email !== null) {
            userId = requestClaimObject.email;
        }
        else {
            return errorResponse('user id is either empty or invalid', context.awsRequestId);

        }

    }

    try {
        const userSitesData = await fetchUserSettings(userId, dependencies.ddb);
        return successResponse(userSitesData.Items[0]);
    } catch (error) {
        console.error(error);
        return errorResponse(error.message, context.awsRequestId);
    }

}

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
    "body": JSON.stringify(
        data
    ),
    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

// this function is used to query dynamo db and 
// returns in response, the user settings data for a particular use.
function fetchUserSettings(userId, ddb) {

    var params = {
        TableName: 'dev_isr_user_info',
        KeyConditionExpression: "#user_id = :userId",
        ProjectionExpression: 'userId, firstName, lastName, loggedIn, mobileNumber, tempFormat, timeFormat, dateFormat, userLanguage, vaccumFormat, #role', // remove to get all data
        ExpressionAttributeNames: {
            "#user_id": "userId",
            "#role" : "role"
        },
        ExpressionAttributeValues: {
            ":userId": userId
        }
    };
    return ddb.query(params).promise();
}
