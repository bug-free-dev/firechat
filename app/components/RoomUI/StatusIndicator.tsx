'use client';

import { FaCheck, FaCheckDouble } from 'react-icons/fa';

const StatusIndicator: React.FC<{ status?: 'sent' | 'delivered' | 'read' }> = ({ status }) => {
	if (!status) return null;

	const iconClass = 'w-3 h-3';

	switch (status) {
		case 'sent':
			return <FaCheck className={`${iconClass} text-neutral-400`} />;
		case 'delivered':
			return <FaCheckDouble className={`${iconClass} text-neutral-400`} />;
		case 'read':
			return <FaCheckDouble className={`${iconClass} text-lime-500`} />;
		default:
			return null;
	}
};

export default StatusIndicator;
