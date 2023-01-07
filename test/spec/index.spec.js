'use strict'

process.env.EXPORTER_CHECK_INTERVAL_MILLIS = 250
process.env.EXPORTER_METRICS_RETENTION = 1000

const pkg = require('../../package.json')
const http = require('http')
const { expect } = require('chai')

let i = 0
const wResolvedPath = require.resolve('../../lib/w')
delete require.cache[wResolvedPath]

let returnTwoPips = false
let returnOnePip3 = false
let throwError = false

require.cache[wResolvedPath] = {
    id: wResolvedPath,
    file: wResolvedPath,
    loaded: true,
    exports: () => {
        i++

        if (returnTwoPips) {
            return Promise.resolve(`23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
            USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
            pip       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
            pip       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
            `)
        } else if (returnOnePip3) {
            return Promise.resolve(`23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
            USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
            pip3       pts/0    192.168.2.111    23:50    1.00s  0.15s  0.01s w
            `)
        } else if (throwError) {
            return Promise.reject('Err!')
        } else {
            return Promise.resolve(`23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
            USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
            pip      pts/0    192.168.2.107    23:51    1.00s  0.15s  0.01s w
            pip      pts/1    192.168.2.107    23:50    1.00s  0.15s  0.01s ls
            pipX     pts/2    44.33.22.1       23:49    1.00s  0.15s  0.01s w
            `)
        }
    }
}

const waitAndExpectMetricStrings = (waitMillis, ...expectedMetric) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            http.get('http://localhost:9839/metrics', (response) => {
                if (response.statusCode !== 200) {
                    reject(response.statusCode)
                    return
                }
                const responseData = []
                response.on('data', (data) => {
                    responseData.push(data.toString('ascii'))
                })
                response.on('end', () => {
                    const body = responseData.join()

                    expectedMetric.forEach((metric) => {
                        try {
                            expect(body).to.contain(metric)
                        } catch (e) {
                            console.error('Assertion error.', 'Full response was...')
                            console.error(body)
                            console.error('Expected to find', metric)
                            throw e
                        }
                    })
                    resolve()
                })
            })
        }, waitMillis)
    })
}

const waitAndDoNotExpectMetricStrings = (waitMillis, ...expectedMetric) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            http.get('http://localhost:9839/metrics', (response) => {
                if (response.statusCode !== 200) {
                    reject(response.statusCode)
                    return
                }
                const responseData = []
                response.on('data', (data) => {
                    responseData.push(data.toString('ascii'))
                })
                response.on('end', () => {
                    const body = responseData.join()
                    expectedMetric.forEach((metric) => {
                        try {
                            expect(body).to.not.contain(metric)
                        } catch (e) {
                            console.error('Assertion error.', 'Full response was...')
                            console.error(body)
                            console.error('Expected to NOT find', metric)
                            throw e
                        }
                    })
                    resolve()
                })
            })
        }, waitMillis)
    })
}


describe('WhatActiveUsersExporter', () => {

    const index = require('../../lib/index')

    after(() => {
        return index()
    })

    it('indicates with a metric that exporter is up', () => {
        return waitAndExpectMetricStrings(500, `what_up{version="${pkg.version}"} 1`)
    })

    it('indicates with a metric that exporter is up', () => {
        throwError = true
        return waitAndExpectMetricStrings(1500, `what_up{version="${pkg.version}"} 0`)
    })

    it('returns one active sessions', () => {
        returnOnePip3 = true
        throwError = false
        return waitAndExpectMetricStrings(500, 'user_sessions_currently_active{user="pip3"} 1')
    })

    it('adds another metric for a new session', () => {
        returnTwoPips = false
        returnOnePip3 = false
        return waitAndExpectMetricStrings(500, 'user_sessions_currently_active{user="pip"} 2', 'user_sessions_currently_active{user="pipX"} 1')
    })

    it('adds metrics for each session', () => {
        returnOnePip3 = false
        returnTwoPips = false
        throwError = false
        return waitAndExpectMetricStrings(500,
            'each_session_currently_active{ip="192.168.2.107",user="pip",tty="pts/0"} 1',
            'each_session_currently_active{ip="192.168.2.107",user="pip",tty="pts/1"} 1',
            'each_session_currently_active{ip="44.33.22.1",user="pipX",tty="pts/2"} 1')
    })

    it('removes metric of terminated sessions', async () => {
        returnOnePip3 = true
        await waitAndExpectMetricStrings(2000, 'user_sessions_currently_active{user="pip3"} 1')
        await waitAndExpectMetricStrings(0, 'each_session_currently_active{ip="192.168.2.111",user="pip3",tty="pts/0"} 1')
        returnOnePip3 = false
        returnTwoPips = false
        throwError = false
        await waitAndDoNotExpectMetricStrings(2000, 'user_sessions_currently_active{user="pip3"} 1')
        await waitAndExpectMetricStrings(500,
            'each_session_currently_active{ip="192.168.2.111",user="pip3",tty="pts/0"} 0',
            'each_session_currently_active{ip="192.168.2.107",user="pip",tty="pts/0"} 1',
            'each_session_currently_active{ip="192.168.2.107",user="pip",tty="pts/1"} 1',
            'each_session_currently_active{ip="44.33.22.1",user="pipX",tty="pts/2"} 1')
    })
})