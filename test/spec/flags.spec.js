'use strict'

const flags = require('../../lib/flags')
const spawnSync = require('child_process').spawnSync
const { expect } = require('chai')

describe('Flags', () => {
    const knownFlags = {
        '--listen.host': '123.0.0.1',
        '--listen.port': '48123',
        '--metrics.endpoint': '/prometheus',
        '--metrics.prefix': 'where',
        '--metrics.with-timestamp': 'true',
        '--scrape.interval': '2'
    }

    const map = {
        '--listen.host': 'host',
        '--listen.port': 'port',
        '--metrics.endpoint': 'endpoint',
        '--metrics.prefix': 'prefix',
        '--metrics.with-timestamp': 'timestamp',
        '--scrape.interval': 'interval'
    }

    Object.entries(knownFlags).forEach(([key, value]) => {
        it('should parse ' + key + ' with syntax flag=value', () => {
            const result = flags([`${key}=${value}`])
            expect(result[map[key]]).to.equal(value)
        })
        it('should parse ' + key + ' with syntax flag value', () => {
            const result = flags([`${key}=${value}`])
            expect(result[map[key]]).to.equal(value)
        })
    })

    it('should parse all given flags', () => {
        const allFlags = Object.entries(knownFlags).reduce((context, [key, value], index) => {
            if (index % 2 === 0) {
                context.push(`${key}=${value}`)
            } else {
                context.push(key)
                context.push(value)
            }
            return context
        }, [])
        const result = flags(allFlags)
        expect(Object.keys(result)).to.have.length(6)
        Object.keys(map).forEach(key => {
            expect(result[map[key]]).to.equal(knownFlags[key])
        })
    })

    it('should print help to console', () => {
        return new Promise((resolve) => {
            const output = spawnSync('node', ["-e", "require(\"./lib/flags\")([\"--help\"])"])
            Object.keys(knownFlags).forEach(flag => {
                expect(output.stdout.toString('ascii')).to.contain(flag)
            })
            resolve()
        })
    })

    it('should exit if a flag has no value', () => {
        return new Promise((resolve) => {
            const output = spawnSync('node', ["-e", "require(\"./lib/flags\")([\"--listen.host\"])"])
            expect(output.status).to.equal(1)
            expect(output.stdout).to.be.empty
            expect(output.stderr.toString('ascii')).to.contain('needs a value')
            resolve()
        })
    })
})