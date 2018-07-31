import React from 'react'
import { Icon, Dropdown, Menu, Modal, message } from 'antd'
import { UserAddForm } from './user-add-form'
import { UserDeleteForm } from './user-delete-form'
import api from '../model/api'

const { Item, Divider } = Menu

class UserMenu extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			userAddModalVisible: false,
			userDeleteModalVisible: false,
		}
	}
	// helper
	getFormValues = (form) => new Promise((rs, rj) => {
		form.validateFields((err, values) => {
			if (err) {
				rj(err)
			} else {
				rs(values)
			}
		})
	})
	tryCatchAndGetFormValuesAndCallback = (formRefName, callback) => {
		return async () => {
			try {
				const formValues = await this.getFormValues(this.refs[formRefName])
				await callback(formValues)
			} catch (e) {
				if (e instanceof Error) {
					message.error(e.message)
				} else {
					message.error(`Invalid ${Object.keys(e).join(',')}`)
				}
			}
		}
	}
	// menu
	profile = () => message.info(`Welcome ${this.props.username}`)
	userAdd = () => this.setState({ userAddModalVisible: true })
	userDelete = () => this.setState({ userDeleteModalVisible: true })
	logout = () => api.logout().then(this.props.onLogout).catch(message.error)

	userAddSubmit = this.tryCatchAndGetFormValuesAndCallback('userAddForm', async({ username, password }) => {
		const rs = await api.addUser(username, password)
		message.info(`Create ${rs ? 'success' : 'failed'}`)
		this.setState({ userAddModalVisible: false })
	})

	userDeleteSubmit = this.tryCatchAndGetFormValuesAndCallback('userDeleteForm', async({ username, password }) => {
		const success = await api.deleteUser(username, password)
		message.info(`Delete ${success ? 'success' : 'failed'}`)
		this.setState({ userDeleteModalVisible: false })
		if (success) {
			this.logout()
		}
	})

	render() {
		const menu = (
			<Menu onClick={({ key }) => this[key]()}>
				<Item key='profile'>
					<Icon type="profile" />Welcome {this.props.username}
				</Item>
				<Item key='userAdd'>
					<Icon type="user-add" />Create New User
				</Item>
				<Item key='userDelete'>
					<Icon type="user-delete" />Delete Account
				</Item>
				<Divider />
				<Item key='logout'>
					<Icon type="logout" />Logout
				</Item>
			</Menu>
		)
		const userAddModal = (
			<Modal
				title="Add Admin User"
				visible={this.state.userAddModalVisible}
				onOk={this.userAddSubmit}
				onCancel={() => this.setState({ userAddModalVisible: false })}
			>
				<UserAddForm ref='userAddForm' />
			</Modal>
		)
		const userDeleteModal = (
			<Modal
				title="Provide your password to DELETE this account"
				visible={this.state.userDeleteModalVisible}
				okText='Delete'
				okType='danger'
				cancelText='Cancel'
				onOk={this.userDeleteSubmit}
				onCancel={() => this.setState({ userDeleteModalVisible: false })}
			>
				<UserDeleteForm ref='userDeleteForm' username={this.props.username} />
			</Modal>
		)
		return (
			<span>
				{userAddModal}
				{userDeleteModal}
				<Dropdown overlay={menu} trigger={['click']}>
					<Icon style={{ color: 'white', fontSize: 30, lineHeight: '64px', float: 'right', cursor: 'pointer' }} type='user' />
				</Dropdown>
			</span>
		)
	}
}

export default { UserMenu }
