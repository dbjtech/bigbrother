import R from 'ramda'
import fileSaver from 'file-saver'
import React from 'react'
import ReactDOM from 'react-dom'
import { Layout, Spin } from 'antd'
import { LoginForm } from './component/login-form'
import { QueryForm } from './component/query-form'
import { LogTable } from './component/table'
import { UserMenu } from './component/user-menu'
import api from './model/api'
import './index.css'

const { Header, Content } = Layout

class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: true,
			username: '',
			rows: [],
		}
		api.queryUser()
			.then(rs => this.setState({ username: rs, loading: false }))
			.catch(() => this.setState({ loading: false }))

		window.R = R
		window.fileSaver = fileSaver
	}
	onTableData = rows => this.setState({ rows })
	onLogin = username => this.setState({ username })
	onLogout = () => this.setState({ username: '' })
	render() {
		if (this.state.loading) {
			return (
				<Layout style={{ backgroundColor: 'white' }}>
					<Header>
						<span style={{ color: 'white', fontSize: 30 }}>📜Bigbrother</span>
					</Header>
					<Content style={{ textAlign: 'center' }}>
						<Spin size="large" style={{ marginTop: 150, marginLeft: 'auto', marginBottom: 150, marginRight: 'auto' }} />
						<span style={{ marginLeft: 20, fontSize: 20 }}>Loading</span>
					</Content>
				</Layout>
			)
		} else if (!this.state.username) {
			return (
				<Layout style={{ backgroundColor: 'white' }}>
					<Header>
						<span style={{ color: 'white', fontSize: 30 }}>📜Bigbrother</span>
					</Header>
					<Content>
						<div style={{ marginTop: 20, marginLeft: 'auto', marginBottom: 50, marginRight: 'auto', maxWidth: 320 }}>
							<LoginForm onLogin={this.onLogin} />
						</div>
					</Content>
				</Layout>
			)
		} else {
			return (
				<Layout style={{ backgroundColor: 'white' }}>
					<Header>
						<span style={{ color: 'white', fontSize: 30 }}>📜Bigbrother</span>
						<UserMenu username={this.state.username} onLogout={this.onLogout} />
					</Header>
					<Content style={{ marginLeft: 5, marginRight: 5}}>
						<div style={{ marginTop: 20, marginBottom: 50 }}>
							<QueryForm onTableData={this.onTableData} />
							<LogTable tableData={this.state.rows} />
						</div>
					</Content>
				</Layout>
			)
		}
	}
}

ReactDOM.render(<App />, document.getElementById('root'))
