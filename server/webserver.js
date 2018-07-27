const Koa = require('koa')
const serve = require('koa-static')
const session = require('koa-session')
const Router = require('koa-router')
// const cors = require('@koa/cors')
const koaBody = require('koa-body')
const qs = require('koa-qs')
const _ = require('lodash')
const solr = require('./solr-api.js')

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

function ensureLogin(ctx) {
	if (!ctx.session.username) {
		throw Response.Need_Login
	}
}

router.get('/api/logs', async (ctx) => {
	ensureLogin(ctx)
	const options = ctx.request.query
	if (_.isEmpty(options)) {
		throw Response.Invalid_Params
	}
	const rs = await solr.queryKeyword(options)
	ctx.body = {
		status_code: 200,
		result: rs,
	}
})

router.get('/api/hostnames', async (ctx) => {
	ensureLogin(ctx)
	ctx.body = {
		status_code: 200,
		result: await solr.getHostnames(),
	}
})

router.get('/api/appnames', async (ctx) => {
	ensureLogin(ctx)
	ctx.body = {
		status_code: 200,
		result: await solr.getAppNames(),
	}
})

router.get('/api/user', async (ctx) => {
	ensureLogin(ctx)
	ctx.body = {
		status_code: 200,
		result: ctx.session.username,
	}
})

router.post('/api/login', async (ctx) => {
	const { username, password } = ctx.request.body
	if (!username || !password) {
		throw Response.Invalid_Params
	}
	if (!await solr.checkAdminPassword(username, password)) {
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
app.use(koaBody())
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
	console.log('Ensure admin account')
	initAdmin().then((ok) => {
		if (!ok) {
			setTimeout(ensureAdmin, 5000)
		} else {
			console.log('Ensure admin account finished')
		}
	}).catch((e) => {
		console.log(e.message)
		setTimeout(ensureAdmin, 5000)
	})
}

const port = getPort() || 3000
app.listen(port, () => {
	console.log('server start @', port)
	ensureAdmin()
})
