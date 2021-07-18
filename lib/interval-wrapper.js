'use strict'

const ids = []

module.exports = {

    new: (callback, millis) => {
        ids.push(setInterval(callback, millis))
    },

    clearAll: () => {
        ids.forEach(id => clearInterval(id))
    }
}