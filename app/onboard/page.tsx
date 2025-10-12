'use client';

import Slidy from '@/app/components/SlidesUI/Slidy';
import { ProtectedRoute } from '../lib/routing/component/ProtectedRoute';
import { AuthState } from '@/app/lib/routing/util/helper';

export default function Page() {
	return (
		<ProtectedRoute
			allowedStates={[AuthState.NEW_USER, AuthState.NOT_ONBOARDED, AuthState.AUTHENTICATED]}
		>
			<Slidy />
		</ProtectedRoute>
	);
}
