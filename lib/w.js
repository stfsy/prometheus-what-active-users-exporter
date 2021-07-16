'use strict'

const { exec } = require('child_process')
const { platform } = require('os')

let shell

if (platform().includes('win')) {
    process.env.comspec = 'C:\\Program Files\\Git\\git-bash.exe'
    shell = 'bash'
}

module.exports = () => {
    return new Promise((resolve, reject) => {
        exec('w', {
            shell
        }, (err, stdout, stderr) => {
            if (err) {
                reject(err)
            } else {
                resolve(stdout)
            }
        })
    })
}