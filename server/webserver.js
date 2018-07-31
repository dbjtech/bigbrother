const Koa = require('koa')
const serve = require('koa-static')
const session = require('koa-session')
const Router = require('koa-router')
// const cors = require('@koa/cors')
const koaBody = require('koa-body')
const qs = require('koa-qs')
const _ = require('lodash')
const solr = require('./solr-api.js')
const log4js = require('log4js')

log4js.configure({
	appenders: [{
		type: 'stdout',
		// category: '',
		layout: {
			type: 'pattern',
			pattern: '[%.1p %d{yyMMdd hh:mm:ss O}] [%c] %m',
		},
	}],
})
const console = log4js.getLogger('webserver')

const app = new Koa()
const router = new Router()

const Response = {
	OK: {
		status_code: 200,
		result: 'OK',
	},
	Invalid_Params: {
		status_code: 400,
		result: 'Invalid params',
	},
	Invalid_User: {
		status_code: 403,
		result: 'Invalid user or password',
	},
	Need_Login: {
		status_code: 401,
		result: 'Need login',
	},
}

function ensureLogin(ctx, next) {
	if (!ctx.session.username) {
		throw Response.Need_Login
	}
	return next()
}

function ensureParams(ctx, next) {
	const { body, query } = ctx.request
	ctx.data = _.merge({}, body, query)
	if (_.isEmpty(ctx.data)) {
		throw Response.Invalid_Params
	}
	return next()
}

function bindAPI(api) {
	return async (ctx, next) => {
		let rs = api(ctx.data, ctx)
		if (rs instanceof Promise) {
			rs = await rs
		}
		ctx.body = {
			status_code: 200,
			result: rs,
		}
		await next()
	}
}

router.get('/api/logs', ensureLogin, ensureParams, bindAPI(solr.queryKeyword))
router.get('/api/hostnames', ensureLogin, bindAPI(solr.getHostnames))
router.get('/api/appnames', ensureLogin, bindAPI(solr.getAppNames))
router.get('/api/user', ensureLogin, bindAPI((__, ctx) => ctx.session.username))
router.post('/api/user', ensureLogin, ensureParams, bindAPI(solr.addAdminUser))
router.delete('/api/user', ensureLogin, ensureParams, bindAPI(solr.removeAdminUser))

router.post('/api/login', async (ctx) => {
	const { username, password } = ctx.request.body
	if (!username || !password) {
		throw Response.Invalid_Params
	}
	if (!await solr.getAdminUser({ username, password })) {
		throw Response.Invalid_User
	}
	ctx.session.username = username
	ctx.body = {
		status_code: 200,
		result: username,
	}
})

router.post('/api/logout', async (ctx) => {
	ctx.session = null
	ctx.body = Response.OK
})

app.use(async (ctx, next) => {
	try {
		await next()
	} catch (e) {
		if (e instanceof Error) {
			throw e
		} else {
			ctx.body = e
		}
	}
})

// remove this in production
// app.use(cors({ credentials: true }))
app.use(serve(`${__dirname}/../portal/dist`))
app.use(koaBody({ strict: false }))
qs(app)
app.keys = ['bigbrother']
app.use(session(app))
app.use(router.routes())
app.use(router.allowedMethods())

function getPort() {
	let port = process.env.PORT
	if (!port) {
		const index = process.argv.indexOf('--port')
		if (index !== -1) {
			port = process.argv[index + 1]
		}
	}
	port = Number(port)
	if (port <= 0 || port > 65535) {
		throw new Error('Invalid port')
	}
	return port
}

async function initAdmin() {
	if (!await solr.isAdminCoreEmpty()) {
		return true
	}
	const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
	const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin'
	const rs = await solr.addAdminUser(username, password)
	return rs
}

function ensureAdmin() {
	console.info('Ensure admin account')
	initAdmin().then((ok) => {
		if (!ok) {
			setTimeout(ensureAdmin, 5000)
		} else {
			console.info('Ensure admin account finished')
		}
	}).catch((e) => {
		console.info(e.message)
		setTimeout(ensureAdmin, 5000)
	})
}

const port = getPort() || 3000
app.listen(port, () => {
	console.info('server start @', port)
	ensureAdmin()
})
