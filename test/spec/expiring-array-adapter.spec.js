'use strict'

const ExpiringArrayAdapter = require('../../lib/expiring-array-adapter')

const { expect } = require('chai')

const delay = (millis) => {
    return new Promise((resolve) => {
        setTimeout(resolve, millis)
    })
}

describe('ExpiringArrayAdapter', () => {

    it('removes element from array after 500ms', async () => {
        const expiringArray = new ExpiringArrayAdapter(500)
        expiringArray.push('1')
        expect(expiringArray.get(0)).to.equal('1')
        await delay(2000)
        expect(expiringArray.get(0)).to.be.undefined
    })

    it('does not add duplicated elements', async () => {
        const expiringArray = new ExpiringArrayAdapter(500)
        expiringArray.push('1')
        expiringArray.push('1')
        expect(expiringArray.length).to.equal(1)
    })
})