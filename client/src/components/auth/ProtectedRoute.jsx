import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.rol !== requiredRole) {
        // Redirigir a una ruta por defecto si no tiene permisos
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
