import axios from 'axios';
import useAuthStore from '../stores/useAuthStore';

// Configuración global de axios
// Usar la IP actual de la red local (necesario para acceso desde smartphones vía LAN)
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
axios.defaults.baseURL = API_URL;

// Interceptor global de peticiones
axios.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor global de respuestas para manejar token expirado
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expirado o inválido, desloguear
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default axios;
