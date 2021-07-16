'use strict'

const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus')
const { MeterProvider } = require('@opentelemetry/metrics')

const gracefulShutdown = require('http-graceful-shutdown')
const w = require('./w')
const parser = require('./parser')

const host = process.env.EXPORTER_LISTEN_HOST || '127.0.0.1'
const port = process.env.EXPORTER_LISTEN_PORT || '48151'
const endpoint = process.env.EXPORTER_METRICS_ENDPOINT || '/metrics'
const prefix = process.env.EXPORTER_METRICS_PREFIX || 'what'
const appendTimestamp = Boolean(process.env.EXPORTER_METRICS_APPEND_TIMESTAMP)
const interval = process.env.EXPORTER_CHECK_INTERVAL_MILLIES || 5000

const crypto = require('crypto')
crypto.createHash('sha256').update('abc')

const exporter = new PrometheusExporter({ host, port, endpoint, appendTimestamp, prefix }, () => {
    console.log('Prometheus exporter running on port', port)
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

const lookupInterval = setInterval(async () => {
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
}, interval)

gracefulShutdown(exporter._server, {
    development: false,
    timeout: 5000,
    signals: 'SIGINT SIGTERM',
    onShutdown: () => {
        clearInterval(lookupInterval)
    }
})