'use client';

import { FireHeader } from '@/app/components/UI';
import { ProtectedRoute } from '@/app/lib/routing/component/ProtectedRoute';

export default function Page() {
	return (
		<ProtectedRoute>
			<FireHeader />
			<span>In progress</span>
		</ProtectedRoute>
	);
}
