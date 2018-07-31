import React from 'react'
import { Form, Input, Icon } from 'antd'

class UserDeleteForm_ extends React.Component {
	render() {
		const { getFieldDecorator } = this.props.form
		return (
			<Form>
				<Form.Item>
				{getFieldDecorator('username', { initialValue: this.props.username })(
					<Input prefix={<Icon type='user' />} disabled />
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
const UserDeleteForm = Form.create()(UserDeleteForm_)

export default { UserDeleteForm }
