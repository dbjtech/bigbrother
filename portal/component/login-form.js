import React from 'react'
import { Form, Button, Input, Icon, message } from 'antd'
import api from '../model/api'


class LoginForm_ extends React.Component {
	getFormValues = () => new Promise((rs, rj) => {
		this.props.form.validateFields((err, values) => {
			if (err) {
				rj(err)
			} else {
				rs(values)
			}
		})
	})

	onSubmit = async () => {
		try {
			const { username, password } = await this.getFormValues()
			const rs = await api.login(username, password)
			message.info(`Welcome ${rs}`)
			this.props.onLogin(rs)
		} catch (e) {
			if (e instanceof Error) {
				message.error(e.message)
			} else {
				message.error(`Invalid ${Object.keys(e).join(',')}`)
			}
		}
	}
	
	render() {
		const { getFieldDecorator } = this.props.form
		return (
			<Form onSubmit={(e) => {e.preventDefault(); this.onSubmit()}}>
				<Form.Item>
					<div style={{ color: 'gray', fontSize: 40, textAlign: 'center', margin: 30 }}>📜Bigbrother</div>
				</Form.Item>
				<Form.Item>
				{getFieldDecorator('username', { rules: [{ required: true, message: 'Please input your username!' }] })(
					<Input prefix={<Icon type='user' />} placeholder='Username' />
				)}
				</Form.Item>
				<Form.Item>
				{getFieldDecorator('password', { rules: [{ required: true, message: 'Please input your password!' }] })(
					<Input prefix={<Icon type='lock' />} placeholder='Password' type='password' />
				)}
				</Form.Item>
				<Button type='primary' htmlType='submit' style={{ width: '100%' }}>Login</Button>
			</Form>
		)
	}
}
const LoginForm = Form.create()(LoginForm_)

export default { LoginForm }
