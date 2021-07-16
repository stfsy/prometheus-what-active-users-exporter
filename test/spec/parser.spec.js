'use strict'

const parser = require('../../lib/parser')
const { expect } = require('chai')

describe('Parser', () => {
    it('returns emtpy result if no user logged in', () => {
        const input = ` 23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
        USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
        `
        const result = parser(input)
        expect(result).to.have.length(0)
    })
    it('returns list with size one if one user is logged in', () => {
        const input = ` 23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
        USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
        pi       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
        `
        const results = parser(input)
        expect(results).to.have.length(1)
    })
    it('returns one user object for one logged in user', () => {
        const input = ` 23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
        USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
        pi       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
        `
        const results = parser(input)
        const result = results[0]
        expect(result.user).to.equal('pi')
        expect(result.tty).to.equal('pts/0')
        expect(result.from).to.equal('192.168.2.107')
        expect(result['login@']).to.equal('23:50')
        expect(result.idle).to.equal('1.00s')
        expect(result.jcpu).to.equal('0.15s')
        expect(result.pcpu).to.equal('0.01s')
        expect(result.what).to.equal('w')
    })
    it('returns one user object for one logged in user', () => {
        const input = ` 23:50:13 up 1 day, 11:33,  1 user,  load average: 0.08, 0.03, 0.01
        USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
        pi       pts/0    192.168.2.107    23:50    1.00s  0.15s  0.01s w
        raspi       pts/1    195.168.2.107    24:50    5.00s  3.15s  1.01s x
        `
        const results = parser(input)
        const result = results[0]
        expect(result.user).to.equal('pi')
        expect(result.tty).to.equal('pts/0')
        expect(result.from).to.equal('192.168.2.107')
        expect(result['login@']).to.equal('23:50')
        expect(result.idle).to.equal('1.00s')
        expect(result.jcpu).to.equal('0.15s')
        expect(result.pcpu).to.equal('0.01s')
        expect(result.what).to.equal('w')
        const secondResult = results[1]
        expect(secondResult.user).to.equal('raspi')
        expect(secondResult.tty).to.equal('pts/1')
        expect(secondResult.from).to.equal('195.168.2.107')
        expect(secondResult['login@']).to.equal('24:50')
        expect(secondResult.idle).to.equal('5.00s')
        expect(secondResult.jcpu).to.equal('3.15s')
        expect(secondResult.pcpu).to.equal('1.01s')
        expect(secondResult.what).to.equal('x')
    })
})