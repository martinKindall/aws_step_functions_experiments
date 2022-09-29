#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStepFunctionOrdersStack } from '../lib/cdk_step_function_orders-stack';

const app = new cdk.App();
new CdkStepFunctionOrdersStack(app, 'CdkStepFunctionOrdersStack');
