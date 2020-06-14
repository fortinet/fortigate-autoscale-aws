import {
    AutoscaleHandler,
    ScheduledEventHandler,
    AutoscaleTgwHandler,
    ScheduledEventTgwHandler,
    LicenseHandler,
    CfnServiceEventHandler
} from './func';

// NOTE: this exports style is for AWS Lambda compatibility
exports.autoscaleHandler = AutoscaleHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.scheduledEventHandler = ScheduledEventHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.autoscaleTgwHandler = AutoscaleTgwHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.scheduledEventTgwHandler = ScheduledEventTgwHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.licenseHandler = LicenseHandler;

// NOTE: this exports style is for AWS Lambda compatibility
exports.cfnServiceEventHandler = CfnServiceEventHandler;
