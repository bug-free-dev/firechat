import Desk from '@/app/components/DeskUI/Desk';
import { ProtectedRoute } from '../lib/routing/component/ProtectedRoute';

export default function Page() {
	return (
		<ProtectedRoute>
			<Desk />
		</ProtectedRoute>
	);
}
