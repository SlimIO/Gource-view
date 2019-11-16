# gource-view
![Version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/SlimIO/Gource-view/master/package.json?token=Aeue0P3eryCYRikk9tHZScyXOpqtMvFIks5ca-XwwA%3D%3D&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/Gource-view/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
![dep](https://img.shields.io/david/SlimIO/Gource-view.svg)
![size](https://img.shields.io/github/repo-size/SlimIO/Gource-view.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/SlimIO/Gource-view/badge.svg?targetFile=package.json)](https://snyk.io/test/github/SlimIO/Gource-view?targetFile=package.json)
[![Build Status](https://travis-ci.com/SlimIO/Gource-view.svg?branch=master)](https://travis-ci.com/SlimIO/Gource-view)

Gource generator for github organization.

<p align="center">
    <img src="https://i.imgur.com/dcyPhXg.png">
</p>

## Requirements
- [Node.js](https://nodejs.org/en/) v12 or higher
- [Gource](https://gource.io/)

> ⚠️ gource.cmd must be available in the Windows path

## Getting Started

```bash
$ git clone https://github.com/SlimIO/Gource-view.git
$ cd Gource-view
$ npm ci
$ npm start
```

## Environment Variables

To configure the project you have to register (set) environment variables on your system. These variables can be set in a **.env** file (that file must be created at the root of the project).
```
GIT_TOKEN=
GITHUB_ORGA=SlimIO
```

To known how to get a **GIT_TOKEN** or how to register environment variables follow our [Governance Guide](https://github.com/SlimIO/Governance/blob/master/docs/tooling.md#environment-variables).

## Creating categories
It's possible to create categories (like branch) by creating a config file for your Organization (like SlimIO). For example please take a look at `src/config/SlimIO.json`.

## Dependencies

|Name|Refactoring|Security Risk|Usage|
|---|---|---|---|
|[@slimio/is](https://github.com/SlimIO/is#readme)|Minor|Low|Type Checker|
|[dotenv](https://github.com/motdotla/dotenv)|Minor|Low|Loads environment variables from .env|
|[fetch-github-repositories](https://github.com/fraxken/fetch-github-repositories#readme)|Minor|Low|Fetch github repositories|
|[isomorphic-git](https://isomorphic-git.org/)|⚠️Major|High|JavaScript GIT Implementation|
|[make-promises-safe](https://github.com/mcollina/make-promises-safe#readme)|Minor|Low|Force Node.js DEP00018|

## License
MIT
