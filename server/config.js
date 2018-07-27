const _ = require('lodash')

const config = _.defaults({
	verbose: process.env.VERBOSE,
	solrHost: process.env.SOLR_HOST,
	solrPort: process.env.SOLR_PORT,
	solrCollectionName: process.env.SOLR_COLLECTION_NAME,
	logHostName: process.env.LOG_HOST_NAME,
	logMaxCount: process.env.LOG_MAX_COUNT,
	logMaxTime: process.env.LOG_MAX_TIME,
}, {
	verbose: true, // print the logs it collects
	// solrHost: '172.16.0.133', // solr host
	host: 'localhost',
	solrPort: 10000, // solr port
	solrCollectionName: 'collection1', // solr collection name
	logHostName: 'UNKNOW_HOST', // machine name set to the doc
	logMaxCount: 1000, // post a doc when collect more than logMaxCount lines
	logMaxTime: 30000, // post a doc when now > lastPostTime + logMaxTime, unit ms
})

module.exports = config
