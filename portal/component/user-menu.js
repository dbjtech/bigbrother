import React from 'react'
import { Icon, Dropdown, Menu, message } from 'antd'
import api from '../model/api'

const { Item, Divider } = Menu

class UserMenu extends React.Component {
	profile = () => message.info(`Welcome ${this.props.username}`)
	userAdd = () => message.info('not implement')
	logout = () => api.logout().then(this.props.onLogout).catch(message.error)

	render() {
		const menu = (
			<Menu onClick={({ key }) => this[key]()}>
				<Item key='profile'>
					<Icon type="profile" />Welcome {this.props.username}
				</Item>
				<Item key='userAdd'>
					<Icon type="user-add" />Create New User
				</Item>
				<Divider />
				<Item key='logout'>
					<Icon type="logout" />Logout
				</Item>
			</Menu>
		)
		return (
			<Dropdown overlay={menu} trigger={['click']}>
				<Icon style={{ color: 'white', fontSize: 30, lineHeight: '64px', float: 'right', cursor: 'pointer' }} type='user' />
			</Dropdown>
		)
	}
}

export default { UserMenu }
