# Active Users Exporter for Prometheus

[![Build Status](https://travis-ci.org/stfsy/prometheus-what-active-users-exporter.svg)](https://travis-ci.org/stfsy/prometheus-what-active-users-exporter)
[![Dependency Status](https://img.shields.io/david/stfsy/prometheus-what-active-users-exporter.svg)](https://github.com/stfsy/prometheus-what-active-users-exporter/blob/master/package.json)
[![DevDependency Status](https://img.shields.io/david/dev/stfsy/prometheus-what-active-users-exporter.svg)](https://github.com/stfsy/prometheus-what-active-users-exporter/blob/master/package.json)
[![Npm downloads](https://img.shields.io/npm/dm/prometheus-what-active-users-exporter.svg)](https://www.npmjs.com/package/prometheus-what-active-users-exporter)
[![Npm Version](https://img.shields.io/npm/v/prometheus-what-active-users-exporter.svg)](https://www.npmjs.com/package/prometheus-what-active-users-exporter)
[![Git tag](https://img.shields.io/github/tag/stfsy/prometheus-what-active-users-exporter.svg)](https://github.com/stfsy/prometheus-what-active-users-exporter/releases)
[![Github issues](https://img.shields.io/github/issues/stfsy/prometheus-what-active-users-exporter.svg)](https://github.com/stfsy/prometheus-what-active-users-exporter/issues)
[![License](https://img.shields.io/npm/l/prometheus-what-active-users-exporter.svg)](https://github.com/stfsy/prometheus-what-active-users-exporter/blob/master/LICENSE)


This is a simple server that scrapes the output of the unix command `w`. [w displays information about the users currently on the machine, and their processes. ](https://man7.org/linux/man-pages/man1/w.1.html)

**Why would you want to do that?** This exporter will allow you to monitor who logs into your system. So you can define alarms for unauthorized users, the max. amount of active session or even every active user session. **`W` will also monitor logins via SSH which allows you to track even active remote sessions.**

Currently, the only metric it exports is `user_sessions_currently_active` with label `user`:

- user_sessions_currently_active{user=root} 1

The exporter was tested on Ubuntu.

## Getting Started

Download the binary from the [latest release](https://github.com/stfsy/prometheus-what-active-users-exporter/releases/latest). We currently provide binaries for Linux and Alpine Linux on amd64.

To run it:

```bash
./prometheus-what-active-users-exporter [flags]
```

Help on flags:

```bash
./prometheus-what-active-users-exporter --help
```

## Usage
By default the exporter will start with sensible default values. Configuration can be customized with the following command line flags:

-  --listen.host: `default=127.0.0.1` 
-  --listen.port `default=127.0.0.1`
-  --metrics.endpoint `default=/metrics` 
-  --metrics.prefix `default=what`
-  --metrics.with-timestamp `default=false`
-  --scrape.interval `default=5000` 

### Building

```bash
npx pkg --compress GZip --targets node16-linux-x64,node16-alpine-x64,node16-linuxstatic-x64 lib/index.js
```

### Testing

```bash
npm test
```

### TLS and basic authentication

The W exporter does currently not support TLS and basic authentication.

## License

This project is distributed under the MIT license.