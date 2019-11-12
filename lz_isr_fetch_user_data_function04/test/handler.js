const { expect } = require('chai');
const sinon = require('sinon');
const AWS = require('aws-sdk');

const dependencies = {
  // Use sinon.stub(..) to prevent any calls to DynamoDB and
  // enable faking of methods
  ddb: sinon.stub(new AWS.DynamoDB.DocumentClient()),
};

const expectedResponse = {"Items":[{"site_id":7181006282,"site_name":"hamra_test_2"},
  {"site_id":7181006181,"site_name":"hamra_test_1"}]}
const eventHandler = require('../handler')(dependencies);

// (Optional) Keep test output free of
// error messages printed by our lambda function
sinon.stub(console, 'error');

describe('handler', () => {
  // Reset test doubles for isolating individual test cases
  afterEach(sinon.reset);

  it('should call dynamo db scan(...) in case of HTTP GET and return the result', async () => {
    const event = {
      "path": "/dev/sites",
      "httpMethod": "GET",
      "headers": {
        "Accept": "*/*",
        "authorization": "eyJraWQiOiJDTE9EWTQ4RTBZV1g1dnlGUFJURUExSGhBU3UySUxuVURSZmgwTmVBanU4PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxOWFkNzM3YS00ZmYxLTRmYTgtYjNhNy1mN2QyMWRhZjJjZTYiLCJhdWQiOiIxZGpzMnFpcHA0ZWl1ZzE0aXJtNWQ2bGc0aCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6ImIwNzQxMWY4LWUzNDYtNGJmZC1iZmJlLTg4ZmJkOTE5NWM4NyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTYwMjU5MzIyLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV9id25ld2g3dmIiLCJjb2duaXRvOnVzZXJuYW1lIjoiaGFyc2guZ2FyZ0B5YXNoLmNvbSIsImV4cCI6MTU2MDI2MjkyMiwiaWF0IjoxNTYwMjU5MzIyLCJlbWFpbCI6ImhhcnNoLmdhcmdAeWFzaC5jb20ifQ.QqZmt7oJTZWyN5cNVEr3TFtq_qMLVXzB57gz3r_bG7mM2aRo9a2uB6HP8HrdRfKYCoz78WUjAFOI8LZdjJhiHfJcR3xzmXEH7Qt25mYeHE554B8RbtCUCh6Ij2hQUVnQuBPC9Ewwmyk5gAY2a_QuwmLBDcoyRBhdLnDpO67NP4zPYGOTJBU0UjuvfYJEawCQrXK4VkcjpHGZNsaYm62HntyL-uITgkiqog0aGNRTLYQ-G9CNtzTKNvXnZtsc-ISswB3NbKzw35asKYdo6bswP4MB1BjqxGYyBwm24e-daYFZfLNPknf4Ne1g7P6vztpb4_OAxpE-k8p0hyRPJe2-zQ",
        "content-type": "application/json; charset=UTF-8"
      },
      "pathParameters": null,
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
      "functionName": "dev_isr_fetch_user_data",
      "awsRequestId": "3d757102-8ecd-4e73-9794-4f39ff94993f"
    }
    // Fake DynamoDB client behavior
    dependencies.ddb.scan.returns({ promise: sinon.fake.resolves(expectedResponse) });

    const { headers, statusCode, body } = await eventHandler(event, context);

    sinon.assert.calledWith(dependencies.ddb.scan, {
      ExpressionAttributeValues: { ':userId': "harsh.garg@yash.com" },
      FilterExpression: "contains(users_list , :userId)",
      ProjectionExpression: "site_id, site_name",
      TableName: "dev_isr_device_info"
    });
    expect(headers['Content-Type']).to.equal('application/json');
    expect(statusCode).to.equal(200);
    expect(body).to.equal(JSON.stringify({
      sites_list: expectedResponse.Items
    }));
  });

  it('should return an error message if a dynamo db call fails', async () => {
    const event = {
      "path": "/dev/sites",
      "httpMethod": "GET",
      "headers": {
        "Accept": "*/*",
        "authorization": "eyJraWQiOiJDTE9EWTQ4RTBZV1g1dnlGUFJURUExSGhBU3UySUxuVURSZmgwTmVBanU4PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxOWFkNzM3YS00ZmYxLTRmYTgtYjNhNy1mN2QyMWRhZjJjZTYiLCJhdWQiOiIxZGpzMnFpcHA0ZWl1ZzE0aXJtNWQ2bGc0aCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6ImIwNzQxMWY4LWUzNDYtNGJmZC1iZmJlLTg4ZmJkOTE5NWM4NyIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTYwMjU5MzIyLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuZXUtd2VzdC0xLmFtYXpvbmF3cy5jb21cL2V1LXdlc3QtMV9id25ld2g3dmIiLCJjb2duaXRvOnVzZXJuYW1lIjoiaGFyc2guZ2FyZ0B5YXNoLmNvbSIsImV4cCI6MTU2MDI2MjkyMiwiaWF0IjoxNTYwMjU5MzIyLCJlbWFpbCI6ImhhcnNoLmdhcmdAeWFzaC5jb20ifQ.QqZmt7oJTZWyN5cNVEr3TFtq_qMLVXzB57gz3r_bG7mM2aRo9a2uB6HP8HrdRfKYCoz78WUjAFOI8LZdjJhiHfJcR3xzmXEH7Qt25mYeHE554B8RbtCUCh6Ij2hQUVnQuBPC9Ewwmyk5gAY2a_QuwmLBDcoyRBhdLnDpO67NP4zPYGOTJBU0UjuvfYJEawCQrXK4VkcjpHGZNsaYm62HntyL-uITgkiqog0aGNRTLYQ-G9CNtzTKNvXnZtsc-ISswB3NbKzw35asKYdo6bswP4MB1BjqxGYyBwm24e-daYFZfLNPknf4Ne1g7P6vztpb4_OAxpE-k8p0hyRPJe2-zQ",
        "content-type": "application/json; charset=UTF-8"
      },
      "pathParameters": null,
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
      "functionName": "dev_isr_fetch_user_data",
      "awsRequestId": "3d757102-8ecd-4e73-9794-4f39ff94993f"
    }
    dependencies.ddb.scan.returns({ promise: sinon.fake.rejects(new Error('failed to connect to DB')) });

    const { headers, statusCode, body } = await eventHandler(event, context);

    sinon.assert.called(console.error);
    expect(headers['Content-Type']).to.equal('application/json');
    expect(statusCode).to.equal(500);
    expect(JSON.parse(body).error).to.equal('failed to connect to DB');
  });
});
