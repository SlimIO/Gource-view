# gource-view
![Version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/SlimIO/Gource-view/master/package.json?token=Aeue0P3eryCYRikk9tHZScyXOpqtMvFIks5ca-XwwA%3D%3D&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/Gource-view/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
![dep](https://img.shields.io/david/SlimIO/Gource-view.svg)
![size](https://img.shields.io/github/repo-size/SlimIO/Gource-view.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/SlimIO/Gource-view/badge.svg?targetFile=package.json)](https://snyk.io/test/github/SlimIO/Gource-view?targetFile=package.json)

## Requirements
- Node.js v10 or higher
- [Gource](https://gource.io/)

> ⚠️ gource.cmd must be available in path

## Getting Started

```bash
$ git clone https://github.com/SlimIO/Gource-view.git
$ npm install
```

Then create a local `.env` file with a Personal Github token
```
GITHUB_TOKEN=
GITHUB_ORGA=SlimIO
```

Then, run `npm start`.

## Dependencies

|Name|Refactoring|Security Risk|Usage|
|---|---|---|---|
|[@slimio/is](https://github.com/SlimIO/is#readme)|Minor|Low|Type Checker|
|[isomorphic-git](https://isomorphic-git.org/)|⚠️Major|High|JavaScript GIT Implementation|
|[make-promises-safe](https://github.com/mcollina/make-promises-safe#readme)|Minor|Low|Force Node.js DEP00018|
|[fetch-github-repositories](https://github.com/fraxken/fetch-github-repositories#readme)|Minor|Low|Fetch github repositories|
|[premove](https://github.com/lukeed/premove#readme)|Minor|Low|Remove recursively|

## License
MIT
