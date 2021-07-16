'use strict';

module.exports = function parse(output) {
    const lines = output.split('\n')

    const columns = lines[1].split(' ').filter(column => column).map(entry => entry.toLowerCase())
    const values = lines.slice(2).map(line => line.split(' ').filter(entry => entry))
    return values.slice(0, values.length - 1).reduce((context, next) => {
        const line = {}
        next.forEach((value, index) => {
            line[columns[index]] = value
        })
        context.push(line)
        return context
    }, [])
}