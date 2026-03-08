import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children, role }: { children: React.ReactNode, role?: 'admin' | 'customer' }) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to /login but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check if specified
    if (role && user?.role !== role) {
        // If they are logged in but don't have the right role (e.g. customer trying to access admin)
        // Redirect them to home or an unauthorized page
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
