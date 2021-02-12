# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.1] - 2021-01-26

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
