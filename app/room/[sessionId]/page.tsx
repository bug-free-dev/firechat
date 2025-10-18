'use client';

import Room from '@/app/components/RoomUI/Room';
import { ProtectedRoute } from '@/app/lib/routing/component/ProtectedRoute';

export default function Page() {
	return (
		<ProtectedRoute>
			<Room />
		</ProtectedRoute>
	);
}
