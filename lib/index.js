'use strict'

const http = require('http')
const client = require('prom-client')
const pkg = require('../package.json')

const gracefulShutdown = require('http-graceful-shutdown')
const w = require('./w')
const parser = require('./parser')
const flags = require('./flags')

const commandLineFlags = flags(process.argv)

const host = commandLineFlags.host || process.env.EXPORTER_LISTEN_HOST || '127.0.0.1'
const port = commandLineFlags.port || process.env.EXPORTER_LISTEN_PORT || '9839'
const endpoint = commandLineFlags.endpoint || process.env.EXPORTER_METRICS_ENDPOINT || '/metrics'
const prefix = commandLineFlags.prefix || process.env.EXPORTER_METRICS_PREFIX || ''
const appendTimestamp = commandLineFlags.timestamp || Boolean(process.env.EXPORTER_METRICS_APPEND_TIMESTAMP)
const interval = Number(commandLineFlags.interval || process.env.EXPORTER_CHECK_INTERVAL_MILLIS || 5000)

console.log(`${pkg.name} ${pkg.version}\n\nStarted with configuration:\nhost         ${host}\nport         ${port}\nendpoint     ${endpoint}\nappendTs     ${appendTimestamp}\ninterval     ${interval}\n`)

const register = new client.Registry()

const metricName = (base) => {
    // preserve current behaviour for default (no explicit prefix):
    // - `what_up` remains the up metric name when `prefix` is empty (keeps tests/clients happy)
    // If a prefix is provided, prepend it to all metric names.
    if (prefix && prefix.length > 0) return `${prefix}_${base}`
    if (base === 'up') return 'what_up'
    return base
}

const userSessionsGauge = new client.Gauge({
    name: metricName('user_sessions_currently_active'),
    help: 'Sum of sessions per user',
    labelNames: ['user'],
    registers: [register]
})

const eachSessionGauge = new client.Gauge({
    name: metricName('each_session_currently_active'),
    help: 'Single sessions per user',
    labelNames: ['ip', 'user', 'tty'],
    registers: [register]
})

const upGauge = new client.Gauge({
    name: metricName('up'),
    help: 'Health and status of the exporter',
    labelNames: ['version'],
    registers: [register]
})

let up = 1
let aggregatedUserSessions = []
let singleUserSessions = []

const lookup = async () => {
    try {
        const wResult = await w()
        up = 1
        const result = parser(wResult)

        const sessionsByUser = result.map(({ user, 'login@': login, from, tty }) => ({ user, login, from, tty }))
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

    // Update prom-client gauges
    // handle outdated aggregated metrics
    const outdatedAgg = aggregatedUserSessions.slice(0, -1)
    outdatedAgg.forEach(metric => {
        Object.keys(metric).forEach((key) => {
            userSessionsGauge.set({ user: key }, 0)
        })
    })
    aggregatedUserSessions = [aggregatedUserSessions.at(-1)]
    const currentAgg = aggregatedUserSessions.at(-1) || {}
    Object.keys(currentAgg).forEach((key) => {
        userSessionsGauge.set({ user: key }, currentAgg[key].length)
    })

    const outdatedSingle = singleUserSessions.slice(0, -1)
    outdatedSingle.forEach(metric => {
        Object.entries(metric).forEach(([key, { user, from, tty }]) => {
            eachSessionGauge.set({ ip: from, user, tty }, 0)
        })
    })
    singleUserSessions = [singleUserSessions.at(-1)]
    const currentSingle = singleUserSessions.at(-1) || {}
    currentSingle && Object.entries(currentSingle).forEach(([key, { user, from, tty }]) => {
        eachSessionGauge.set({ ip: from, user, tty }, 1)
    })

    upGauge.set({ version: pkg.version }, up)
}

const lookupInterval = setInterval(lookup, interval)
lookup()

const server = http.createServer(async (req, res) => {
    if (req.url !== endpoint) {
        res.statusCode = 404
        res.end('not found')
        return
    }
    try {
        res.setHeader('Content-Type', register.contentType)
        const metrics = await register.metrics()
        res.end(metrics)
    } catch (err) {
        res.statusCode = 500
        res.end(err.message)
    }
})

server.listen(Number(port), host, () => {
    console.log('Exporter now running on port', port)
})

gracefulShutdown(server, {
    development: false,
    timeout: 5000,
    signals: 'SIGINT SIGTERM',
    onShutdown: () => {
        clearInterval(lookupInterval)
    }
})

module.exports = () => {
    clearInterval(lookupInterval)
    return new Promise((resolve) => {
        server.close(() => resolve())
    })
}