'use strict'

const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus')
const { MeterProvider } = require('@opentelemetry/metrics')

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
const interval = commandLineFlags.interval || process.env.EXPORTER_CHECK_INTERVAL_MILLIS || 5000

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
}).getMeter('logged-in-users', 1)

let result = null
let sessions = {}
let logins = {}

meter.createValueObserver('user_sessions_currently_active', {
    description: 'Currently logged in users',
    constantLabels: ['user', 'ip']
}, (observer) => {
    if (!sessions) {
        return
    }
    Object.keys(sessions).forEach((key) => {
        observer.observe(sessions[key].length, {
            user: key
        })
    })
})

meter.collect()

const lookup = async () => {
    try {
        const wResult = await w()
        result = parser(wResult)
        sessions = result.map(({ user, 'login@': login, from }) => {
            return Object.assign({}, { user, login, from })
        }).reduce((context, next) => {
            if (!Array.isArray(context[next.user])) {
                context[next.user] = []
            }
            context[next.user].push(next)
            return context
        }, {})
        meter.collect()
    } catch (e) {
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