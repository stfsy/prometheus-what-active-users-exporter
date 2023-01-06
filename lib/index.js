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
const retention = Number(commandLineFlags.retention || process.env.EXPORTER_METRICS_RETENTION || 1000)

console.log(`${pkg.name} ${pkg.version}

Started with configuration:
host         ${host}
port         ${port}
endpoint     ${endpoint}
prefix       ${prefix}
timestamp    ${appendTimestamp}
interval     ${interval}
retention    ${retention}
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
let aggregatedUserSessions = {}

meter.getMeter('default').createObservableGauge('user_sessions_currently_active', {
    description: 'Sum of sessions per user',
    constantLabels: ['user']
}).addCallback((observer) => {
    if (!aggregatedUserSessions) {
        return
    }
    Object.keys(aggregatedUserSessions).forEach((key) => {
        observer.observe(aggregatedUserSessions[key].length, {
            user: key
        })
    })
})

meter.getMeter('default').createObservableGauge('each_session_currently_active', {
    description: 'Single sessions per user',
    constantLabels: ['user', 'ip', 'tty']
}).addCallback((observer) => {
    if (!aggregatedUserSessions) {
        return
    }
    Object.entries(aggregatedUserSessions).forEach(([key, value]) => {
        value.forEach((session) => {
            const { from, tty } = session
            observer.observe(1, {
                user: key,
                ip: from,
                tty
            })
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
        }).reduce((context, next) => {
            if (!Array.isArray(context[next.user])) {
                context[next.user] = []
            }
            context[next.user].push(next)
            return context
        }, {})

        aggregatedUserSessions = {}
        // update sessions with fresh data
        // will override current data of active sessions
        Object.entries(sessionsByUser).forEach(([key, value]) => {
            if (!Array.isArray(aggregatedUserSessions[key])) {
                aggregatedUserSessions[key] = []
            }
            aggregatedUserSessions[key].push(...value)
        })

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