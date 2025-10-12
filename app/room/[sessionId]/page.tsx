'use client';

import { ProtectedRoute } from '@/app/lib/routing/component/ProtectedRoute';
import Room from '@/app/components/RoomUI/Room';

export default function Page() {
	return (
		<ProtectedRoute>
			<Room />
		</ProtectedRoute>
	);
}
