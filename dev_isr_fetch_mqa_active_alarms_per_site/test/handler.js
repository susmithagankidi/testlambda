const { expect } = require('chai');
const sinon = require('sinon');
const AWS = require('aws-sdk');

const dependencies = {
  // Use sinon.stub(..) to prevent any calls to DynamoDB and
  // enable faking of methods
  ddb: sinon.stub(new AWS.DynamoDB.DocumentClient()),
};

const expectedFetchAlarmsForSiteResponse = {
  "Items": [{
    "alarmCode": "02",
    "alarmCurrentstate": 2,
    "alarmName": "NoAgitation",
    "alarmNumber": "0",
    "alarmText": "Roerwerk draait niet",
    "alarmTimestampAcknowledged": "1970-01-01T00:00:00.000Z",
    "alarmTimestampActivated": "2019-09-23T12:02:23.000Z",
    "alarmType": "yellow",
    "deviceName": "MQA_Ruitenberg",
    "msgId": "af775156-a3b5-4cb8-b610-0f326dcb73858906148000320",
    "product": "mqa",
    "productId": "89061480",
    "productionId": "0032",
    "siteId": "af775156-a3b5-4cb8-b610-0f326dcb7385"
  }, {
    "alarmCode": "02",
    "alarmCurrentstate": 2,
    "alarmName": "NoAgitation",
    "alarmNumber": "1",
    "alarmText": "Roerwerk draait niet",
    "alarmTimestampAcknowledged": "1970-01-01T00:00:00.000Z",
    "alarmTimestampActivated": "2019-09-25T11:19:59.000Z",
    "alarmType": "yellow",
    "deviceName": "MQA_Ruitenberg",
    "msgId": "af775156-a3b5-4cb8-b610-0f326dcb73858906148000321",
    "product": "mqa",
    "productId": "89061480",
    "productionId": "0032",
    "siteId": "af775156-a3b5-4cb8-b610-0f326dcb7385"
  }, {
    "alarmCode": "13",
    "alarmCurrentstate": 2,
    "alarmName": "CleaningTooLong",
    "alarmNumber": "2",
    "alarmText": "Maximale reiningstijd overschreden",
    "alarmTimestampAcknowledged": "1970-01-01T00:00:00.000Z",
    "alarmTimestampActivated": "2019-10-08T13:04:53.000Z",
    "alarmType": "yellow",
    "deviceName": "MQA_Ruitenberg",
    "msgId": "af775156-a3b5-4cb8-b610-0f326dcb73858906148000322",
    "product": "mqa",
    "productId": "89061480",
    "productionId": "0032",
    "siteId": "af775156-a3b5-4cb8-b610-0f326dcb7385"
  }
  ], Count: 3
}
const eventHandler = require('../handler')(dependencies);

// (Optional) Keep test output free of
// error messages printed by our lambda function
sinon.stub(console, 'error');

describe('handler', () => {
  // Reset test doubles for isolating individual test cases
  afterEach(sinon.reset);

  it('should call dynamo db scan(...) in case of HTTP GET and return the result', async () => {
    const event = {
      "path": "/dev/user/mqa/alarms/active",
      "httpMethod": "GET",
      "headers": {
        "Accept": "*/*",
        "authorization": "eyJraWQiOiJDTE9EWTQ4RTBZV1g1dnlGUFJURUExSGhBU3UySUxuVURSZmgwTmVBanU4PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxOWFkNzM3YS00ZmYxLTRmYTgtYjNhNy1mN2QyMWRhZjJjZTYiLCJhdWQiOiIxZGpzMnFpcHA0ZWl1ZzE0aXJtNWQ2bGc0aCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6ImIwNzQxMWY4LWUzNDYtNGJmZC1iZmJlLTg4ZmJkOTE5NWM4NyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTYwMjU5MzIyLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV9id25ld2g3dmIiLCJjb2duaXRvOnVzZXJuYW1lIjoiaGFyc2guZ2FyZ0B5YXNoLmNvbSIsImV4cCI6MTU2MDI2MjkyMiwiaWF0IjoxNTYwMjU5MzIyLCJlbWFpbCI6ImhhcnNoLmdhcmdAeWFzaC5jb20ifQ.QqZmt7oJTZWyN5cNVEr3TFtq_qMLVXzB57gz3r_bG7mM2aRo9a2uB6HP8HrdRfKYCoz78WUjAFOI8LZdjJhiHfJcR3xzmXEH7Qt25mYeHE554B8RbtCUCh6Ij2hQUVnQuBPC9Ewwmyk5gAY2a_QuwmLBDcoyRBhdLnDpO67NP4zPYGOTJBU0UjuvfYJEawCQrXK4VkcjpHGZNsaYm62HntyL-uITgkiqog0aGNRTLYQ-G9CNtzTKNvXnZtsc-ISswB3NbKzw35asKYdo6bswP4MB1BjqxGYyBwm24e-daYFZfLNPknf4Ne1g7P6vztpb4_OAxpE-k8p0hyRPJe2-zQ",
        "content-type": "application/json; charset=UTF-8"
      },
      "pathParameters": {
        "siteId": "af775156-a3b5-4cb8-b610-0f326dcb7385"
      },
      "requestContext": {
        "authorizer": {
          "claims": {
            "email": "harsh.garg@yash.com"
          }
        }
      }
    };

    const context = {
      "callbackWaitsForEmptyEventLoop": true,
      "functionName": "dev_isr_fetch_mqa_active_alarms_per_site",
      "awsRequestId": "3d757102-8ecd-4e73-9794-4f39ff94993f"
    };

    var params1 = {
      TableName: 'dev_isr_mqa_alarm',
      KeyConditionExpression: '#v_site_id = :v_siteId',
      FilterExpression: '#v_alarm_currentstate = :v_alarm_currentstate',
      ExpressionAttributeNames: {
        "#v_site_id": "siteId",
        "#v_alarm_currentstate": "alarmCurrentstate"
      },
      ExpressionAttributeValues: {
        ":v_siteId": "af775156-a3b5-4cb8-b610-0f326dcb7385",
        ":v_alarm_currentstate": 2
      }
    };
    // Fake DynamoDB client behavior
    dependencies.ddb.query.returns({ promise: sinon.fake.resolves(expectedFetchAlarmsForSiteResponse) });

    const { headers, statusCode, body } = await eventHandler(event, context);

    sinon.assert.calledWith(dependencies.ddb.query, params1);
    expect(headers['Content-Type']).to.equal('application/json');
    expect(statusCode).to.equal(200);
    expect(body).to.equal('{"siteId":"af775156-a3b5-4cb8-b610-0f326dcb7385","items":[{"alarmCode":"02","alarmCurrentstate":2,"alarmName":"NoAgitation","alarmNumber":"1","alarmText":"Roerwerk draait niet","alarmTimestampAcknowledged":"1970-01-01T00:00:00.000Z","alarmTimestampActivated":"2019-09-25T11:19:59.000Z","alarmType":"yellow","deviceName":"MQA_Ruitenberg","msgId":"af775156-a3b5-4cb8-b610-0f326dcb73858906148000321","product":"mqa","productId":"89061480","productionId":"0032","siteId":"af775156-a3b5-4cb8-b610-0f326dcb7385"},{"alarmCode":"13","alarmCurrentstate":2,"alarmName":"CleaningTooLong","alarmNumber":"2","alarmText":"Maximale reiningstijd overschreden","alarmTimestampAcknowledged":"1970-01-01T00:00:00.000Z","alarmTimestampActivated":"2019-10-08T13:04:53.000Z","alarmType":"yellow","deviceName":"MQA_Ruitenberg","msgId":"af775156-a3b5-4cb8-b610-0f326dcb73858906148000322","product":"mqa","productId":"89061480","productionId":"0032","siteId":"af775156-a3b5-4cb8-b610-0f326dcb7385"}]}');
  });

  it('should return an error message if a dynamo db call fails', async () => {
    const event = {
      "path": "/dev/user/mqa/alarms/active",
      "httpMethod": "GET",
      "headers": {
        "Accept": "*/*",
        "authorization": "eyJraWQiOiJDTE9EWTQ4RTBZV1g1dnlGUFJURUExSGhBU3UySUxuVURSZmgwTmVBanU4PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxOWFkNzM3YS00ZmYxLTRmYTgtYjNhNy1mN2QyMWRhZjJjZTYiLCJhdWQiOiIxZGpzMnFpcHA0ZWl1ZzE0aXJtNWQ2bGc0aCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6ImIwNzQxMWY4LWUzNDYtNGJmZC1iZmJlLTg4ZmJkOTE5NWM4NyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTYwMjU5MzIyLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV9id25ld2g3dmIiLCJjb2duaXRvOnVzZXJuYW1lIjoiaGFyc2guZ2FyZ0B5YXNoLmNvbSIsImV4cCI6MTU2MDI2MjkyMiwiaWF0IjoxNTYwMjU5MzIyLCJlbWFpbCI6ImhhcnNoLmdhcmdAeWFzaC5jb20ifQ.QqZmt7oJTZWyN5cNVEr3TFtq_qMLVXzB57gz3r_bG7mM2aRo9a2uB6HP8HrdRfKYCoz78WUjAFOI8LZdjJhiHfJcR3xzmXEH7Qt25mYeHE554B8RbtCUCh6Ij2hQUVnQuBPC9Ewwmyk5gAY2a_QuwmLBDcoyRBhdLnDpO67NP4zPYGOTJBU0UjuvfYJEawCQrXK4VkcjpHGZNsaYm62HntyL-uITgkiqog0aGNRTLYQ-G9CNtzTKNvXnZtsc-ISswB3NbKzw35asKYdo6bswP4MB1BjqxGYyBwm24e-daYFZfLNPknf4Ne1g7P6vztpb4_OAxpE-k8p0hyRPJe2-zQ",
        "content-type": "application/json; charset=UTF-8"
      },
      "pathParameters": {
        "siteId": "af775156-a3b5-4cb8-b610-0f326dcb7385"
      },
      "requestContext": {
        "authorizer": {
          "claims": {
            "email": "harsh.garg@yash.com"
          }
        }
      }
    };
    const context = {
      "callbackWaitsForEmptyEventLoop": true,
      "functionName": "dev_isr_fetch_mqa_active_alarms_per_site",
      "awsRequestId": "3d757102-8ecd-4e73-9794-4f39ff94993f"
    };

    dependencies.ddb.query.returns({ promise: sinon.fake.rejects(new Error('failed to connect to DB')) });

    const { headers, statusCode, body } = await eventHandler(event, context);

    sinon.assert.called(console.error);
    expect(headers['Content-Type']).to.equal('application/json');
    expect(statusCode).to.equal(500);
    expect(JSON.parse(body).error).to.equal('failed to connect to DB');
  });
});
