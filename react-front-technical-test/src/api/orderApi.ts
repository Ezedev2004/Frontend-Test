// src/api/orderApi.ts

import axios from 'axios';
// J'ai mis 'any' sur OrderData dans les fonctions pour faciliter le mappage
import { Order, OrderItem } from './types'; 

// L'URL de base de notre API Laravel
const LARAVEL_API_BASE = 'http://127.0.0.1:8000/api/orders';

// ... (fetchOrders reste inchangé) ...
export const fetchOrders = async (): Promise<Order[]> => {
    try {
        const response = await axios.get(LARAVEL_API_BASE);
        return response.data; 
    } catch (error) {
        console.error("Erreur lors de la récupération des commandes:", error);
        throw new Error("Impossible de charger les commandes depuis le serveur.");
    }
};

/**
 * Met à jour une commande existante.
 */
// Utilisation de 'any' pour éviter les erreurs de type lors du mappage Nom/client_name
export const updateOrder = async (id: number, orderData: any): Promise<any> => {
    
    // 🚨 CORRECTION DU MAPPAGE DES CLÉS POUR LARAVEL (BACKEND)
    const itemsPayload = orderData.items.map((item: any) => ({
        produit_id_djoli: item.product_id_djoli,
        Nom_du_produit: item.product_name,    // Mappé : product_name -> Nom_du_produit
        Quantité: item.quantity,              // Mappé : quantity -> Quantité
        Prix_unitaire: item.unit_price,       // Mappé : unit_price -> Prix_unitaire
    }));

    const payload = {
        Nom: orderData.client_name,      // Mappé : client_name -> Nom
        Téléphone: orderData.client_phone, // Mappé : client_phone -> Téléphone
        items: itemsPayload,
    };
    
    try {
        const response = await axios.put(`${LARAVEL_API_BASE}/${id}`, payload);
        return response.data;
    } catch (error) {
        // Ajout d'une meilleure gestion d'erreur 422 pour le debug
        if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
             console.error("Détails de l'erreur 422 (Validation Laravel):", error.response.data); 
             throw new Error(`Erreur de validation. Détails dans la console.`);
        }
        console.error(`Erreur lors de la mise à jour de la commande ${id}:`, error);
        throw new Error(`Échec de la mise à jour de la commande #${id}.`);
    }
};

// ... (deleteOrder reste inchangé) ...
export const deleteOrder = async (id: string | number): Promise<void> => {
    try {
        await axios.delete(`${LARAVEL_API_BASE}/${id}`);
    } catch (error) {
        console.error(`Erreur lors de la suppression de la commande ${id}:`, error);
        throw new Error(`Échec de la suppression de la commande #${id}.`);
    }
};


// ... (fetchOrderById reste inchangé) ...
export const fetchOrderById = async (id: string | number): Promise<Order> => {
    try {
        const response = await axios.get(`${LARAVEL_API_BASE}/${id}`);
        return response.data; 
    } catch (error) {
        console.error(`Erreur lors de la récupération de la commande ${id}:`, error);
        throw new Error(`Commande #${id} introuvable ou inaccessible.`);
    }
};

/**
 * Envoie les données d'une nouvelle commande à l'API Laravel.
 */
export const createOrder = async (orderData: any): Promise<any> => {
    
    // 1. Revenir au format ORIGINAL (snake_case/camelCase) qui fonctionnait pour le POST
    const itemsPayload = orderData.items.map((item: any) => ({
        // Utiliser les clés du Frontend / du projet (celles qui passaient le POST)
        product_id_djoli: item.product_id_djoli,
        product_name: item.product_name,    // ⬅️ Clés d'origine
        quantity: item.quantity,            // ⬅️ Clés d'origine
        unit_price: item.unit_price,        // ⬅️ Clés d'origine
    }));

    const payload = {
        client_name: orderData.client_name, // ⬅️ Clé d'origine
        client_phone: orderData.client_phone, // ⬅️ Clé d'origine
        items: itemsPayload,
    };

    try {
        const response = await axios.post(LARAVEL_API_BASE, payload);
        return response.data; 
    } catch (error) {
        // ... (votre gestion d'erreur reste la même) ...
        if (axios.isAxiosError(error) && error.response && error.response.status === 422) {
             console.error("Détails de l'erreur 422 (Validation Laravel):", error.response.data); 
             throw new Error(`Erreur de validation lors de la création. Détails dans la console.`);
        }
        console.error("Erreur lors de la création de la commande :", error);
        throw new Error("Échec de l'enregistrement de la commande sur le serveur.");
    }
};