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

- what_user_sessions_currently_active{user=root} 1

The exporter was tested on Ubuntu.

## Getting Started

Download the binary from the [latest release](https://github.com/stfsy/prometheus-what-active-users-exporter/releases/latest). We currently provide binaries for Linux and Alpine Linux on amd64.

To download latest Linux version and check sha256 sum:

```bash
#!/bin/bash

set -ex

declare -r owner="stfsy"
declare -r name="prometheus-what-active-users-exporter"

declare -r latest_release_url=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/${owner}/${name}/releases/latest)
declare -r latest_version=$(echo ${latest_release_url} | awk -F'/' '{print $8}')
declare -r latest_version_name=${name}-${latest_version}-linux-x64

declare -r shasum_url=https://github.com/${owner}/${name}/releases/download/${latest_version}/sha256sums.txt
declare -r binary_url=https://github.com/${owner}/${name}/releases/download/${latest_version}/${latest_version_name}

curl -L ${shasum_url} > shasums256.txt
curl -L ${binary_url} > ${latest_version_name}

declare -r hash_sum_line=$(cat shasums256.txt | grep ${latest_version_name})
declare -r hash_sum=$(echo ${hash_sum_line} | awk -F' ' '{print $1}')

echo "${hash_sum}  ${latest_version_name}" | sha256sum --check --ignore-missing 

mv ${latest_version_name} ${name}
rm shasums256.txt
```

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
-  --metrics.retention `default=30000`
-  --metrics.endpoint `default=/metrics` 
-  --metrics.prefix `default=what`
-  --metrics.with-timestamp `default=false`
-  --scrape.interval `default=5000` 

:warning: 

There's a tradeoff between detecting every single and possibly very short login vs. putting additional load on your system by querying too often. 
By default, the exporter will query the active sessions every 5s and will store every session for 30s. 
**Meaning**: Login sessions that last less than 5s might no be detected by the exporter. Login sessions that last longer than 5s will be stored for 
up to 30s - even if the user logs off after 6s - to make sure that Prometheus is able to catch the updated metric.


Please make sure that `--metrics.retention` is greater than the scrape interval of your Prometheus job, to ensure Prometheus is able to pick up all values.


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