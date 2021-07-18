'use strict'

const pkg = require('../package.json')

const padRight = (string, num) => {
    while (string.length < num) {
        string += ' '
    }
    return string
}

const knownFlags = {
    '--listen.host': {
        internalName: 'host',
        default: '127.0.0.1',
        description: 'the ip address the exporter uses to listen for incoming connections'
    },
    '--listen.port': {
        internalName: 'port',
        default: '9839',
        description: 'the port the exporter uses to listen for incoming connections'
    },
    '--metrics.retention': {
        internalName: 'retention',
        default: '30000',
        description: 'how long to store user sessions before resetting metric value. Should be larger than scrape interval of your Prometheus job.'
    },
    '--metrics.endpoint': {
        internalName: 'endpoint',
        default: '/metrics',
        description: 'the path of the metrics endpoint'
    },
    '--metrics.prefix': {
        internalName: 'prefix',
        default: 'what',
        description: 'the prefix for all metrics of this exporter'
    },
    '--metrics.with-timestamp': {
        internalName: 'timestamp',
        default: false,
        description: 'add timestamp to all exported metrics'
    },
    '--scrape.interval': {
        internalName: 'interval',
        default: 5000,
        description: 'how often the exporter queries the active users in milliseconds'
    }
}

module.exports = (givenFlags) => {
    if (givenFlags.includes('--help')) {
        const description = Object.keys(knownFlags).reduce((context, next) => {
            context = context + '  ' + padRight(next, 30) + 'default=' + padRight(String(knownFlags[next].default), 15) + knownFlags[next].description + '\n'
            return context
        }, '')
        console.log(`${pkg.name} ${pkg.version}

Usage: ${pkg.name} [flags]...

${description}

There's a tradeoff between detecting every single and possibly very short login vs. putting additional load on your system by querying too often. 
By default, the exporter will query the active sessions every 5s (--scrape.interval) and will store every session for 30s (--metrics.retention). 
Meaning: Login sessions that last less than 5s might no be detected by the exporter. Login sessions that last longer than 5s will be stored for 
up to 30s - even if the user logs off after 6s - to make sure that Prometheus is able to catch the updated metric.

Please make sure that --metrics.retention is greater than the scrape interval of your Prometheus job, to make sure that Prometheus is able to pick up all values.


You can file issues or questions at ${pkg.repository.url.substring(4)}
        `)
        process.exit(0)
        return
    }

    return givenFlags.reduce((context, next, index) => {
        let nextKey = next
        let nextValue = givenFlags[index + 1]
        if (next.includes('=')) {
            nextKey = next.substring(0, next.indexOf('='))
            nextValue = next.substring(next.indexOf('=') + 1)
        }
        if (Object.prototype.hasOwnProperty.call(knownFlags, nextKey)) {
            if (nextValue) {
                context[knownFlags[nextKey].internalName] = nextValue
            } else {
                console.error(`Flag "${nextKey}" needs a value. Please provide one. Check "--help" for default values and descriptions.`)
                process.exit(1)
            }
        }
        return context
    }, {})
}