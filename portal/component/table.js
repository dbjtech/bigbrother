import moment from 'moment'
import React from 'react'
import { Table } from 'antd'

const TimeFormat = 'YYYY-MM-DD HH:mm:ss'

class LogTable extends React.Component {
	render() {
		const columns = [{
			title: '#',
			dataIndex: 'key',
			sorter: (a, b) => a.key - b.key,
		}, {
			title: 'Time',
			dataIndex: 'timestamp',
			sorter: (a, b) => a.timestamp - b.timestamp,
			render: v => moment(v).format(TimeFormat),
		}, {
			title: 'Log',
			dataIndex: 'log',
			render: v => (<span dangerouslySetInnerHTML={{ __html: v }} />),
		}]
		return (
			<Table
				columns={columns}
				dataSource={this.props.tableData}
				size='small'
				scroll={{ x: true}}
				bordered
				pagination={{
					// position: 'top',
					pageSizeOptions: ['10', '50', '100', '500', '1000'],
					showSizeChanger: true,
					showQuickJumper: true,
				}}
			/>
		)
	}
}

export default { LogTable }