const SolrNode = require('solr-node')
const R = require('ramda')
const config = require('./config.js')

const SolrNodeConfig = {
	host: config.solrHost,
	port: config.solrPort,
	core: config.solrCollectionName,
	protocol: 'http',
	debugLevel: config.verbose ? 'DEBUG' : 'INFO',
}

function setQuery(query, options) {
	const defaults = {
		keyword: '*',
		time_start: '*',
		time_end: Math.floor(Date.now() / 1000),
		offset: 0,
		limit: 1,
		hostname: '',
		app_name: '',
	}
	const opt = R.merge(defaults, R.reject(R.isEmpty, options))

	const fq = []
	if (opt.hostname) {
		fq.push({ field: 'hostname', value: opt.hostname })
	}
	if (opt.app_name) {
		fq.push({ field: 'types', value: opt.app_name })
	}
	fq.push({ field: 'dateint', value: `[${opt.time_start} TO ${opt.time_end}]` })

	return query
		.q(opt.keyword === '*' ? '*:*' : { contentindex: opt.keyword })
		.addParams({
			wt: 'json',
		})
		.fq(fq)
		.hlQuery({
			hl: 'on',
			fl: 'packet_content',
			fragsize: 0,
		})
		.sort({
			dateint: 'asc',
		})
		.start(opt.offset)
		.rows(opt.limit)
}

const getSolrHighlightRows = R.pipe(
	R.path(['highlighting']),
	R.values,
	R.pluck('packet_content'),
	R.flatten,
	// 加个换行符方便统一处理
	R.prepend(''),
	// 把多份文档重新拼接为一整份，更好地还原出日志产生时的顺序
	R.join('\n'),
	// 用换行符加行首[进行切割，这样可以使非[I YYMMDD HH:mm:ss]开头的日志保留在同一行。
	// 这种日志通常是错误栈的打印，或者console.log中带了\n的情况。
	// FEFF是UTF8 BOM，日志从文件导入的可能会带这个字符
	R.split(/\r?\n\uFEFF?\[/),
	// 第一行必定是空行，可以去掉
	R.tail,
	// 留下solr标记了高亮的行
	R.filter(e => e.indexOf('</em>') !== -1),
	// 把没有进行切割的换行符替换为<br/>方便前端显示
	R.map(e => R.replace(/\r?\n/g, '<br/>', e)),
	// 把[加回行首
	R.map(e => `[${e}`),
	// 不足之处：如果第一个文档第一行没有时间戳，会多了一个[
)

const getSolrRawRows = (keyword, rs) => R.pipe(
	R.path(['response', 'docs']),
	R.pluck('packet_content'),
	R.prepend(''),
	R.join('\n'),
	R.split(/\r?\n\uFEFF?\[/),
	R.tail,
	R.filter(e => !keyword || keyword === '*' || e.indexOf(keyword) !== -1),
	R.map(e => R.replace(/\r?\n/g, '<br/>', e)),
	R.map(e => `[${e}`),
)(rs)

const getSolrFirstDoc = R.path(['response', 'docs', 0])

async function queryKeyword(options) {
	const client = new SolrNode(SolrNodeConfig)
	const rs = await client.search(setQuery(client.query(), options))
	let rows = getSolrHighlightRows(rs)
	if (!rows.length) {
		rows = getSolrRawRows(options.keyword, rs)
	}
	return {
		meta: {
			total: rs.response.numFound,
			offset: rs.response.start,
			docs: rs.response.docs.length,
		},
		rows,
	}
}

async function checkAdminPassword(username, password) {
	const client = new SolrNode(R.merge(SolrNodeConfig, { core: 'logadmin' }))
	const query = client.query().q('*:*').fq([
		{ field: 'username', value: username },
		{ field: 'password', value: password },
	])
	const rs = await client.search(query)
	const user = getSolrFirstDoc(rs)
	return !!(user && user.username === username && user.password === password)
}

async function isAdminCoreEmpty() {
	const client = new SolrNode(R.merge(SolrNodeConfig, { core: 'logadmin' }))
	const query = client.query().q('*:*')
	const rs = await client.search(query)
	return rs.response.numFound === 0
}

async function addAdminUser(username, password) {
	const client = new SolrNode(R.merge(SolrNodeConfig, { core: 'logadmin' }))
	const rs = await client.update({ username, password, id: Date.now() }, { commit: true })
	return rs.responseHeader.status === 0
}

const getGroups = R.pipe(
	R.path(['grouped']),
	R.values(),
	R.path([0, 'groups']),
	R.pluck('groupValue'),
)

async function queryGroup(field) {
	const client = new SolrNode(SolrNodeConfig)
	const query = client.query()
		.q('*:*')
		.addParams({ wt: 'json' })
		.groupQuery({ on: true, field })
		.rows(20)
	const rs = await client.search(query)
	return getGroups(rs)
}

module.exports = {
	queryKeyword,
	checkAdminPassword,
	getHostnames: () => queryGroup('hostname'),
	getAppNames: () => queryGroup('types'),
	isAdminCoreEmpty,
	addAdminUser,
}
