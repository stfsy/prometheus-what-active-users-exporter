'use strict'

const intervalls = require('../lib/interval-wrapper')

after(() => {
    return intervalls.clearAll()
})