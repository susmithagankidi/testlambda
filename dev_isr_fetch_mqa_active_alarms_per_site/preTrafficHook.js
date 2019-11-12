'use strict';

const AWS = require('aws-sdk');
const CodeDeploy = new AWS.CodeDeploy();
const Lambda = new AWS.Lambda();
const CloudWatch = new AWS.CloudWatch();
const CloudFormation = new AWS.CloudFormation();
const DynamoDB = new AWS.DynamoDB();
const S3 = new AWS.S3();
const ConfigService = new AWS.ConfigService();

const stackId = process.env.StackId;
const functionName = process.env.CurrentVersion;
const namespace = process.env.Namespace;
const metricName = process.env.MetricName;

let currentFunctionName; // To be read from the context

let deploymentStatus;


// Manage AWS API pagination, returning a single array
async function manageApiPagination(objectToCall, methodToCall, params, keyToReturn) {
	let list = [];
	do {
		let data = await objectToCall[methodToCall](params).promise();
		console.log(data);
		for (let item of data[keyToReturn]) {
			list.push(item);
		}
		params.NextToken = data.NextToken;
	} while (params.NextToken != null);
	console.log(list);
	return list;
}


// Return the list of resources in a CloudFormation Stack
async function listStackResources(stackName) {
	console.log("Calling AWS CloudFormation to list Resources for Stack " + stackName);
	return await manageApiPagination(CloudFormation, 'listStackResources', {
		StackName: stackName
	}, 'StackResourceSummaries');
}


// Run a basic check on a Lambda Function
async function testFunction(functionName) {
	let localFitness = 0;
	console.log("Calling AWS Lambda to test Function " + functionName);
	let data = await Lambda.invoke({
		FunctionName: functionName,
		Payload: '"test"' // Default test input value
	}).promise();
	console.log(data); // successful response
	if (data.StatusCode >= 200 && data.StatusCode < 300) {
		localFitness++;
		let body = JSON.parse(data.Payload).body;
		// More specific tests can be implemented per function
		if (body !== undefined) {
			let jsonBody = JSON.parse(body);
			let message = jsonBody.message;
		 	if (message != undefined && message.startsWith('Hello')) {
				// Incrementing fitness for each "passed" unit test
				localFitness++;
			 }
		}
	} else {
		deploymentStatus = 'Fail'; // Function invocation failed 
	}
	return localFitness;
}



// Check compliance to AWS Config Rules
async function checkCompliance(resourceType, resourceId) {
	let localFitness = 0;
	console.log("Calling AWS Config to check compliance to all Rules for Resource " + resourceType + " " + resourceId);
	let compliantResults = await manageApiPagination(ConfigService, 'getComplianceDetailsByResource', {
		ComplianceTypes: [
		  'COMPLIANT' 
		],
		ResourceType: resourceType,
		ResourceId: resourceId
	  }, 'EvaluationResults');
	localFitness += 10 * compliantResults.length;
	console.log("Resource " + resourceType + " " + resourceId +
		" is compliant to " + compliantResults.length + " rules");
	return localFitness;
}



// Report to AWS CodeDeploy the success or failure of the deployment
async function reportExecutionStatus(deploymentId, lifecycleEventHookExecutionId, status) {
	if (deploymentId == null) {
		console.log("No deployment requested.");
		return;
	}
	console.log("Calling CodeDeploy with Status " + status);
	let data = await CodeDeploy.putLifecycleEventHookExecutionStatus({
		deploymentId: deploymentId,
		lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
		status: status // status can be 'Succeeded' or 'Failed'
	}).promise();
	console.log(data);
}


async function putMetric(value) {
	console.log("Posting metric data to CloudWatch " + namespace + " " + metricName + " = " + value);
	var data = await CloudWatch.putMetricData({
		MetricData: [
			{
			MetricName: metricName,
			Timestamp: new Date,
			// Unit: "None",
			Value: value
			}
		],
		Namespace: namespace
	}).promise();
	console.log(data);
}


exports.handler = async (event, context) => {

	console.log("Entering PreTraffic Hook!");
	console.log(JSON.stringify(event));

	if (event == "test") {
		return "ok";
	}

	currentFunctionName = context.functionName;
	
	//Read the DeploymentId from the event payload.
	let deploymentId = event.DeploymentId;
	console.log("DeploymentId: " + deploymentId);

	//Read the LifecycleEventHookExecutionId from the event payload
	let lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;
	console.log("LifecycleEventHookExecutionId: " + lifecycleEventHookExecutionId);

	/*
		[Perform validation or prewarming steps here]
	*/

	deploymentStatus = 'Succeeded'; // Starting value

	try {
		let testResults = await runTests();
		let fitness = testResults.reduce((a, b) => a + b, 0); // Sum all results
		console.log("fitness = " + fitness);
		console.log("deploymentStatus = " + deploymentStatus);
		await reportExecutionStatus(deploymentId, lifecycleEventHookExecutionId, deploymentStatus);
		await putMetric(fitness);
	}
	catch (err) {
		console.log(err, err.stack); // an error occurred
		throw err;
	}

};