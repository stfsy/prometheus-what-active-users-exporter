'use strict'

const spawn = require('child_process').spawn

const platform = require('os').platform()
const isUnix = platform.includes('win') ? false : true

class Runner {
    start(binary, args, cwd, env) {
        return new Promise((resolve, reject) => {
            this._process = spawn(binary, args, { windowsHide: true, env, cwd })

            this._waitForOutputAndCallBack(this._process.stdout, 'running', resolve)

            this._process.stdout.on('data', (data) => {
                console.log('data', data.toString())
            });
        
            this._process.stderr.on('data', (data) => {
                console.log('err', data.toString())
            });

            process.on('SIGHUP', () => {
                this.stop()
            })
        })
    }

    _waitForOutputAndCallBack(stream, message, callback) {
        stream.on('data', function fn(data) {
            if (data.indexOf(message) >= 0) {
                stream.removeListener('data', fn)
                callback()
            }
        })
    }

    stop() {
        if (isUnix) {
            return this._stopUnix()
        } else {
            return this._stopWin()
        }
    }

    _stopUnix() {
        return new Promise((resolve) => {
            if (!this._process.killed) {
                const kill = spawn('kill', [this._process.pid]);
                kill.on('exit', resolve)
            }
        })
    }

    _stopWin() {
        return new Promise((resolve, reject) => {
            if (!this._process.killed) {
                const kill = spawn("taskkill", ["/pid", this._process.pid, '/f', '/t']);
                kill.on('exit', resolve)
            }
        })
    }
}

module.exports = Runner