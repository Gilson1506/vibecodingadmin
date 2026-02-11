import axios from 'axios';
import { API_URL } from './supabase';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Payment API
export const paymentAPI = {
    createExpressPayment: async (data: {
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        amountCents: number;
    }) => {
        const response = await api.post('/api/payments/express', data);
        return response.data;
    },

    createReferencePayment: async (data: {
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        amountCents: number;
    }) => {
        const response = await api.post('/api/payments/reference', data);
        return response.data;
    },

    getPaymentStatus: async (paymentId: string) => {
        const response = await api.get(`/api/payments/${paymentId}/status`);
        return response.data;
    }
};

// Video API (Mux)
export const videoAPI = {
    createUploadUrl: async (lessonId: string) => {
        const response = await api.post('/api/video/upload-url', { lessonId });
        return response.data;
    },

    createLive: async (data: { title: string; liveSessionId: string }) => {
        const response = await api.post('/api/video/create-live', data);
        return response.data;
    },

    getPlaybackToken: async (playbackId: string, type: 'video' | 'thumbnail' = 'video') => {
        const response = await api.get(`/api/video/playback-token/${playbackId}`, {
            params: { type }
        });
        return response.data;
    }
};

export default api;
