'use client';

import { FaCheck, FaCheckDouble } from 'react-icons/fa';

const StatusIndicator: React.FC<{ status?: 'sent' | 'delivered' }> = ({ status }) => {
	if (!status) return null;

	const iconClass = 'w-3 h-3';

	switch (status) {
		case 'sent':
			return <FaCheck className={`${iconClass} text-neutral-400`} />;
		case 'delivered':
			return <FaCheckDouble className={`${iconClass} text-lime-400`} />;
		default:
			return null;
	}
};

export default StatusIndicator;
