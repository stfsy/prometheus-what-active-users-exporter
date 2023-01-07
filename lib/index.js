'use strict'

const telemetry = require('@opentelemetry/api-metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus')
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base')

const pkg = require('../package.json')

const gracefulShutdown = require('http-graceful-shutdown')
const w = require('./w')
const parser = require('./parser')
const flags = require('./flags')

const commandLineFlags = flags(process.argv)

const host = commandLineFlags.host || process.env.EXPORTER_LISTEN_HOST || '127.0.0.1'
const port = commandLineFlags.port || process.env.EXPORTER_LISTEN_PORT || '9839'
const endpoint = commandLineFlags.endpoint || process.env.EXPORTER_METRICS_ENDPOINT || '/metrics'
const prefix = commandLineFlags.prefix || process.env.EXPORTER_METRICS_PREFIX || 'what'
const appendTimestamp = commandLineFlags.timestamp || Boolean(process.env.EXPORTER_METRICS_APPEND_TIMESTAMP)
const interval = Number(commandLineFlags.interval || process.env.EXPORTER_CHECK_INTERVAL_MILLIS || 5000)

console.log(`${pkg.name} ${pkg.version}

Started with configuration:
host         ${host}
port         ${port}
endpoint     ${endpoint}
prefix       ${prefix}
timestamp    ${appendTimestamp}
interval     ${interval}
`)

const exporter = new PrometheusExporter({ host, port, endpoint, appendTimestamp, prefix }, () => {
    console.log('Exporter now running on port', port)
})
const meter = new MeterProvider({
    exporter,
    interval
})
meter.addMetricReader(exporter)

let up = 1
// keep old and new state in array
// index -1 is always new
// other indices are old and metrics need to be removed
let aggregatedUserSessions = []
let singleUserSessions = []

const userSessionsGauge = meter.getMeter('default').createObservableGauge('user_sessions_currently_active', {
    description: 'Sum of sessions per user',
    constantLabels: ['user']
}).addCallback((observer) => {
    // reset previous metrics first
    const outdatedMetrics = aggregatedUserSessions.slice(0, -1)
    outdatedMetrics.forEach(metric => {
        Object.keys(metric).forEach((key) => {
            observer.observe(0, {
                user: key
            })
        })
    })

    aggregatedUserSessions = [aggregatedUserSessions.at(-1)]

    // and update new metrics then
    const newMetrics = aggregatedUserSessions.at(-1)
    Object.keys(newMetrics).forEach((key) => {
        observer.observe(newMetrics[key].length, {
            user: key
        })
    })
})

meter.getMeter('default').createObservableGauge('each_session_currently_active', {
    description: 'Single sessions per user',
    constantLabels: ['user', 'ip', 'tty']
}).addCallback((observer) => {
    // reset previous metrics first
    const outdatedMetrics = singleUserSessions.slice(0, -1)
    outdatedMetrics.forEach((metric) => {
        Object.entries(metric).forEach(([key, { user, from, tty }]) => {
            observer.observe(0, {
                ip: from,
                user,
                tty
            })
        })
    })

    singleUserSessions = [singleUserSessions.at(-1)]

    // and update new metrics then
    const newMetrics = singleUserSessions.at(-1)
    newMetrics && Object.entries(newMetrics).forEach(([key, { user, from, tty }]) => {
        observer.observe(1, {
            ip: from,
            user,
            tty
        })
    })
})

meter.getMeter('default').createObservableGauge('up', {
    description: 'Health and status of the exporter',
    constantLabels: ['version']
}).addCallback(observe => {
    observe.observe(up, {
        version: pkg.version
    })
})

const lookup = async () => {
    try {
        const wResult = await w()
        up = 1
        const result = parser(wResult)

        const sessionsByUser = result.map(({ user, 'login@': login, from, tty }) => {
            return Object.assign({}, { user, login, from, tty })
        })
        singleUserSessions.push(sessionsByUser)

        const aggregatedUserSessionsByUser = sessionsByUser.reduce((context, next) => {
            if (!Array.isArray(context[next.user])) {
                context[next.user] = []
            }
            context[next.user].push(next)
            return context
        }, {})
        aggregatedUserSessions.push(aggregatedUserSessionsByUser)
    } catch (e) {
        up = 0
        console.log(`Could not gather metrics. Will retry after ${interval} ms`, e)
    }
}
const lookupInterval = setInterval(lookup, interval)
lookup()

gracefulShutdown(exporter._server, {
    development: false,
    timeout: 5000,
    signals: 'SIGINT SIGTERM',
    onShutdown: () => {
        clearInterval(lookupInterval)
    }
})

module.exports = () => {
    clearInterval(lookupInterval)
    return exporter.stopServer()
}