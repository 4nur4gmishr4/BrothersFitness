// Centralized configuration for business constants
// Update these values in one place to reflect across the entire application

export const PLAN_PRICES = {
    '1 Month': 700,
    '3 Months': 1800,
    '6 Months': 3300,
    '15 Days': 350
} as const;

export const CONTACT_INFO = {
    aman: {
        name: 'Aman',
        phone: '+919131179343',
        whatsapp: '919131179343'
    },
    pradeep: {
        name: 'Pradeep',
        phone: '+919131272754',
        whatsapp: '919131272754'
    }
};

export const WHATSAPP_COUNTRY_CODE = '91';

export const GYM_NAME = "Brother's Fitness";
