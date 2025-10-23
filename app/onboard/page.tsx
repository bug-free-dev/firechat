import Slidy from '@/app/components/SlidesUI/Slidy';
import { ProtectedRoute } from '@/app/lib/routing/component/ProtectedRoute';
import { AuthState } from '@/app/lib/routing/helpers/compute';

export default function Page() {
	return (
		<ProtectedRoute
			allowedStates={[AuthState.NEW_USER, AuthState.NOT_ONBOARDED, AuthState.AUTHENTICATED]}
		>
			<Slidy />
		</ProtectedRoute>
	);
}
