
const config = {
	// server: 'api',
	server: 'http://localhost:3000/api',
}

function getFetchOptions() {
	return {
		method: 'GET',
		mode: 'cors',
		credentials: 'include',
	}
}

function postFetchOptions(form, action = 'POST') {
	return {
		method: action,
		mode: 'cors',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
		},
		body: form,
	}
}

async function ensureResponse(rs) {
	if (rs.status !== 200) {
		throw new Error(await rs.text())
	}
	const { status_code, result } = await rs.json()
	if (status_code !== 200) {
		throw new Error(result)
	}
	return result
}

async function queryLog(query) {
	const { keyword, timeRange, offset, hostname, app_name, limit } = query
	const qs = new URLSearchParams()
	qs.append('keyword', encodeURIComponent(keyword || ''))
	qs.append('time_start', timeRange[0] ? Math.floor(timeRange[0].valueOf() / 1000) : '')
	qs.append('time_end', timeRange[1] ? Math.floor(timeRange[1].valueOf() / 1000) : '')
	qs.append('hostname', hostname || '')
	qs.append('app_name', app_name || '')
	qs.append('offset', offset || '')
	qs.append('limit', limit || '')
	const rs = await fetch(`${config.server}/logs?${qs.toString()}`, getFetchOptions())
	return await ensureResponse(rs)
}

async function queryHostnames() {
	const rs = await fetch(`${config.server}/hostnames`, getFetchOptions())
	return await ensureResponse(rs)
}

async function queryAppNames() {
	const rs = await fetch(`${config.server}/appnames`, getFetchOptions())
	return await ensureResponse(rs)
}

async function queryUser() {
	const rs = await fetch(`${config.server}/user`, getFetchOptions())
	return await ensureResponse(rs)
}

async function addUser(username, password) {
	const form = new URLSearchParams()
	form.append('username', username)
	form.append('password', password)
	const rs = await fetch(`${config.server}/user`, postFetchOptions(form))
	return await ensureResponse(rs)
}

async function deleteUser(username, password) {
	const form = new URLSearchParams()
	form.append('username', username)
	form.append('password', password)
	const rs = await fetch(`${config.server}/user`, postFetchOptions(form, 'DELETE'))
	return await ensureResponse(rs)
}

async function login(username, password) {
	const form = new URLSearchParams()
	form.append('username', username)
	form.append('password', password)
	const rs = await fetch(`${config.server}/login`, postFetchOptions(form))
	return await ensureResponse(rs)
}

async function logout() {
	const rs = await fetch(`${config.server}/logout`, postFetchOptions())
	return await ensureResponse(rs)
}

export default {
	queryLog,
	queryHostnames,
	queryAppNames,
	queryUser,
	addUser,
	deleteUser,
	login,
	logout,
}
