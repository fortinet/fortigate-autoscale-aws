# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.5.0] - 2021-12-14

### Added

- [enhancement] heartbeat calculation improvement based on heartbeat request sequence and timestamp
- [enhancement] improve primary election facilitating the device sync info #85

### Changed

- [bugfix] a brand new vm elected as the new primary will lead to existing configuration loss

## [3.4.0] - 2021-09-08

### Added

- Add SNS notifications support for FortiGate Autoscale events.

### Changed

- Disabled vm deletion by default.
- Bugfixes for heartbeat calculation related issues.

## [3.3.0] - 2021-02-12

### Added

- Add support for deploying to the US gov cloud regions

### Changed

- All Trinsit Gateway VPN connections now use DF Group 14 and SHA256, previously used DF Group 2 and SHA128

## [3.2.1] - 2021-01-26

### Added

- Add FortiAnalyzer integration

### Changed

- Replaced FortiOS 6.4.3 with 6.4.4

## [3.2.0] - 2020-12-07

### Added

- Added support for FortiOS 6.4.3

### Changed

- Enforced input normalization for bootstrap configuration.
- Fixed a creating extra new TransitGateway when deploying using an existing one.
- Fixed Autoscale handler error.
- Other minor bugfixes.

## [3.1.0] - 2020-09-21

### Added

- a complete rewrite in Typescript based on FortiGate Autoscale (https://github.com/fortinet/fortigate-autoscale).
- Autoscale Core (3.1.0) as node package dependency.
- deployment package for AWS platform only.
- deployment package for the combined features: Hybrid Licensing + Transit Gateway Integration.
- template files in yaml format.
