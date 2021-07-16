'use strict'

const w = require('../../lib/w')
const { platform } = require('os')
const { expect } = require('chai')

let describeOrSkip

if (platform().includes('win')) {
    describeOrSkip = describe.skip
} else {
    describeOrSkip = describe
}

describeOrSkip('W', () => {
    it('executes w command on unix systems', async () => {
        const output = await w()
        expect(output).to.contain('USER').and.to.contain('FROM').and.to.contain('LOGIN@')
    })
})