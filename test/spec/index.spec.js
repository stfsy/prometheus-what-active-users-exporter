'use strict'

const Runner = require('../module-runner')
const runner = new Runner()

const http = require('http')

const { platform } = require('os')
const { expect } = require('chai')

let describeOrSkip

if (platform().includes('win')) {
    describeOrSkip = describe.skip
} else {
    describeOrSkip = describe
}

describeOrSkip('WhatActiveUsersExporter', () => {
    before(() => {
        return runner.start('node', ['lib/index'], '.')
    })

    after(() => {
        return runner.stop()
    })

    it('exports the active users metric', () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                http.get('http://localhost:48151/metrics', (response) => {
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
                        expect(body).to.contain('user_sessions_currently_active')
                    })
                })
            }, 6000)
        })
    })
})