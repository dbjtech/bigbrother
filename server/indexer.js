const _ = require('lodash')
const moment = require('moment-timezone')
const request = require('request-promise')
const config = require('./config.js')

/*
 * push log to server if condition match.
 * logCache will be cleared after doc submited.
 *
 * options:
 *     logAppName: program name to be indexed
 */
class LogSubmitter {
	constructor(emitter, options) {
		this.options = _.defaults(options, config)
		if (!this.options.logAppName) throw new Error('logAppName must set')
		this.logCache = []
		this.lastCommitTime = Date.now()

		emitter.on('log', (line) => {
			this.submitDebounce(line)
		})
		emitter.on('close', () => {
			this.submitDebounce(null, true)
		})
	}

	submitDebounce(line, submitAnyway = false) {
		const now = Date.now()
		if (submitAnyway) {
			if (!this.logCache.length) return null
		} else {
			if (!line) return null
			this.logCache.push(line)
			if (this.options.verbose) {
				console.log(`[${this.options.logHostName}][${this.options.logAppName}]${line}`)
			}
			if (this.logCache.length < this.options.logMaxCount &&
				now < this.lastCommitTime + this.options.logMaxTime) {
				return null
			}
		}
		// submit
		const doc = {}
		doc.id = now + Math.random()

		const lines = this.logCache.join('\n')
		const count = this.logCache.length
		doc.packet_content = lines
		doc.contentindex = lines

		const tMatch = lines.match(/\d{6} \d{2}:\d{2}:\d{2}/)
		const tMoment = tMatch ? moment.tz(tMatch[0], 'YYMMDD HH:mm:ss', process.env.TZ || 'UTC') : moment()
		doc.dateint = tMoment.unix()

		doc.types = this.options.logAppName
		doc.hostname = this.options.logHostName

		const options = {
			url: `http://${this.options.solrHost}:${this.options.solrPort}/solr/${this.options.solrCollectionName}/update/json`,
			method: 'POST',
			json: [doc],
		}
		this.logCache = []
		this.lastCommitTime = now
		return request(options).then((resp) => {
			console.log(`[${this.options.logHostName}][${this.options.logAppName}]${count} docs submit as ${doc.id} ${JSON.stringify(resp)}`)
		}).catch((err) => {
			console.error(`[${this.options.logHostName}][${this.options.logAppName}]${count} docs submit as ${doc.id} failed. ${err.message || err}`)
		})
	}
}


const fs = require('fs').promises
const EventEmitter = require('events')

async function main() {
	const file = process.argv[2]
	console.log('reading file', file)
	const content = await fs.readFile(file, 'utf8')
	const emitter = new EventEmitter()
	// const submitter = new
	LogSubmitter(emitter, { logAppName: 'testApp', solrPort: 10000 })

	_.forEach(content.split('\n'), e => emitter.emit('log', e))
	emitter.emit('close')
}

main().catch(console.log)
