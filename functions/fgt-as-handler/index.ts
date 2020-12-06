import {
    autoscaleHandler,
    scheduledEventHandler,
    autoscaleTgwHandler,
    scheduledEventTgwHandler,
    licenseHandler,
    cfnServiceEventHandler,
    tgwLambdaPeerInvocationHandler,
    fazIntegrationHandler,
    fazIntegrationHandlerService
} from './func';

// NOTE: this exports style is for AWS Lambda compatibility
exports.autoscaleHandler = autoscaleHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.scheduledEventHandler = scheduledEventHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.autoscaleTgwHandler = autoscaleTgwHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.scheduledEventTgwHandler = scheduledEventTgwHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.licenseHandler = licenseHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.cfnServiceEventHandler = cfnServiceEventHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.tgwLambdaPeerInvocationHandler = tgwLambdaPeerInvocationHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.fazIntegrationHandler = fazIntegrationHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.fazIntegrationHandlerService = fazIntegrationHandlerService;
