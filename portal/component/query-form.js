import R from 'ramda'
import moment from 'moment'
import React from 'react'
import { Form, Button, Input, DatePicker, message } from 'antd'
import api from '../model/api'
import { QuerySelect } from './select'

const TimeFormat = 'YYYY-MM-DD HH:mm:ss'

function getTimestamp(line) {
	if (!line) {
		return null
	}
	const raw = line.replace(/<\/?em>/g, '')
	const m = /(\d\d)(\d\d)(\d\d) (\d\d):(\d\d):(\d\d)/.exec(raw)
	if (!m) {
		return null
	}
	return moment(`20${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`).valueOf()
}

function sleep(ms) {
	return new Promise((rs) => {
		setTimeout(() => rs(), ms)
	})
}

class QueryForm_ extends React.Component {
	constructor(props) {
		super(props)
		this.state = this.getInitialState()
	}

	getInitialState = () => R.clone({
		hostnames: [],
		appnames: [],
		loading: false,
		lastQuery: null,
		pauseQueryFlag: false,
		meta: {
			offset: 0,
			total: 0,
			docs: 0,
		},
		rows: [],
	})

	getFormValues = () => new Promise((rs, rj) => {
		this.props.form.validateFields((err, values) => {
			if (err) {
				rj(err)
			} else {
				rs(values)
			}
		})
	})

	queryOnce = async (query) => {
		const result = await api.queryLog(query)

		let curTS = getTimestamp(result.rows[1]) // 第0行很可能是没时间的，默认用第1行
		const dataSource = R.addIndex(R.map)((e, i) => {
			const ts = getTimestamp(e)
			curTS = ts || curTS
			const obj = { key: this.state.rows.length + i, timestamp: curTS, log: e }
			return obj
		}, result.rows)
		this.setState({ meta: result.meta, rows: this.state.rows.concat(dataSource) })
		this.props.onTableData(this.state.rows)
	}

	onQuery = async (loadingMore) => {
		let query
		if (!loadingMore) {
			this.setState(this.getInitialState())
			query = await this.getFormValues()
			query.offset = 0
			query.limit = 5 // scan x docs per solr query
			
			this.setState({ loading: true })
			try {
				await this.queryOnce(query)
				this.setState({ lastQuery: query })
			} catch(e) {
				message.error(e.message)
			}
			this.setState({ loading: false })
		} else {
			this.setState({ pauseQueryFlag: false })
			query = this.state.lastQuery

			this.setState({ loading: true })
			await sleep(250)
			try {
				while(!this.state.pauseQueryFlag) {
					if (this.state.meta.offset >= this.state.meta.total) {
						break
					}
					query.offset = this.state.meta.offset + this.state.meta.docs
					await this.queryOnce(query)
				}
			} catch(e) {
				message.error(e.message)
			}
			this.pauseQuery()
			this.setState({ loading: false })
		}

	}

	pauseQuery = () => {
		this.setState({ pauseQueryFlag: true })
	}
	
	render() {
		const { getFieldDecorator } = this.props.form
		return (
			<Form layout='inline'>
				<Form.Item>
				{getFieldDecorator('hostname')(
					<QuerySelect placeholder='Host Name' style={{ width: 150 }} dataApi={api.queryHostnames} allowClear></QuerySelect>
				)}
				</Form.Item>
				<Form.Item>
				{getFieldDecorator('app_name')(
					<QuerySelect placeholder='App Name' style={{ width: 150 }} dataApi={api.queryAppNames} allowClear></QuerySelect>
				)}
				</Form.Item>
				<Form.Item>
				{getFieldDecorator('timeRange', {
					initialValue: [moment().subtract(1, 'day'), moment()],
				})(
					<DatePicker.RangePicker
						showTime='true'
						format={TimeFormat}
					/>
				)}
				</Form.Item>
				<Form.Item>
				{getFieldDecorator('keyword')(
					<Input.Search
						placeholder='Keyword'
						onSearch={() => this.onQuery()}
						disabled={this.state.loading}
						enterButton
					/>
				)}
				</Form.Item>
				<Form.Item style={{ display: !this.state.loading && this.state.lastQuery ? 'inline-block' : 'none' }}>
					<Button type="primary" icon='sync' onClick={() => this.onQuery(true)}>Load More</Button>
				</Form.Item>
				<Form.Item style={{ display: this.state.loading && this.state.lastQuery ? 'inline-block' : 'none' }}>
					<Button type="primary" icon='loading' onClick={() => this.pauseQuery()}>Pause</Button>
				</Form.Item>
				<Form.Item>
					<p>Load: {this.state.meta.offset + this.state.meta.docs}/{this.state.meta.total}, {this.state.rows.length} Lines.</p>
				</Form.Item>
			</Form>
		)
	}
}
const QueryForm = Form.create()(QueryForm_)

export default { QueryForm }
