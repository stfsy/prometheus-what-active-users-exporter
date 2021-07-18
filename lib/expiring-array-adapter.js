'use strict'

const interval = require('./interval-wrapper')

/**
 * @typedef ExpiringElement
 */
class ExpiringElement {

    constructor(value, expiresAt) {
        this._value = value
        this._expiresAt = expiresAt
    }

    get value() {
        return this._value
    }

    get expired() {
        return Date.now() > this._expiresAt
    }
}

class ExpiringArray {

    constructor(expireAfter) {
        /**
         * @type {Array.<ExpiringElement>}
         */
        this._array = []
        this._expireElementsAfter = expireAfter

        interval.new(() => {
            this._array.forEach((el, index) => {
                if (el.expired) {
                    this._array.splice(index, 1)

                }
            })
        }, 500)
    }

    get length() {
        return this._array.length
    }

    merge(expiringArray) {
        this.push(...expiringArray)
    }

    push(element) {
        if (element instanceof ExpiringElement) {
            const isAlreadyStored = this._array.some(el => el.value === element.value)
            if (!isAlreadyStored) {
                this._array.push(element)
            }
        } else {
            const isAlreadyStored = this._array.some(el => el.value === element)
            if (!isAlreadyStored) {
                this._array.push(new ExpiringElement(element, Date.now() + this._expireElementsAfter))
            }
        }
    }

    get(index) {
        const element = this._array[index]
        if (element) {
            return element.value
        }
    }
}

module.exports = ExpiringArray