import React from 'react'
import { Select, message } from 'antd'

class QuerySelect extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loading: false,
			list: [],
		}
		this.props.dataApi().then((rs) => {
			this.setState({ list: rs })
		}).catch((e) => {
			message.error(e.message)
		})
	}

	render() {
		return (
			<Select {...this.props} >
				{this.state.list.map(e => (<Select.Option key={e}>{e}</Select.Option>))}
			</Select>
		)
	}
}

export default { QuerySelect }
