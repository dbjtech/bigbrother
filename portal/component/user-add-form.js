import React from 'react'
import { Form, Input, Icon } from 'antd'

class UserAddForm_ extends React.Component {
	render() {
		const { getFieldDecorator } = this.props.form
		return (
			<Form>
				<Form.Item>
				{getFieldDecorator('username', { rules: [{ required: true, message: 'Please input username!' }] })(
					<Input prefix={<Icon type='user' />} placeholder='Username' />
				)}
				</Form.Item>
				<Form.Item>
				{getFieldDecorator('password', { rules: [{ required: true, message: 'Please input password!' }] })(
					<Input prefix={<Icon type='lock' />} placeholder='Password' type='password' />
				)}
				</Form.Item>
			</Form>
		)
	}
}
const UserAddForm = Form.create()(UserAddForm_)

export default { UserAddForm }
