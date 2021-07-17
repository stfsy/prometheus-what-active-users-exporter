'use strict'

const Runner = require('../module-runner')
const runner = new Runner()

const http = require('http')

const { expect } = require('chai')

describe('WhatActiveUsersExporterWithFlags', () => {
    before(() => {
        return runner.start('node', ['lib/index', '--scrape.interval=100', '--listen.port=9000'], '.')
    })

    after(() => {
        return runner.stop()
    })

    it('exports the active users metric', () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                http.get('http://localhost:9000/metrics', (response) => {
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
                        expect(body).to.contain('user_sessions_currently_active{user="pi"} 1')
                        resolve()
                    })
                })
            }, 500)
        })
    })
})