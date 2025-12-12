// src/api/djoliApi.ts

import axios from 'axios';
import { DjoliProduct } from './types';

const DJOLI_PRODUCTS_API = 'https://api-preprod.djoli.africa/api/v1/rest/mobile/catalog/products-standards';

export const fetchDjoliProducts = async (): Promise<DjoliProduct[]> => {
    try {
        const response = await axios.get(DJOLI_PRODUCTS_API);
        
        // Assurez-vous que la réponse.data est un tableau d'objets produits
        const products: DjoliProduct[] = response.data.map((product: any) => {
            // Le prix doit être correctement extrait : nous supposons le premier prix dans le tableau 'prices'
            const priceValue = product.prices && product.prices.length > 0 ? product.prices[0].value : 0;
            
            return {
                id: product.id,
                name: product.name,
                price: parseFloat(priceValue), // S'assurer que c'est un nombre
            };
        });

        return products;
        
    } catch (error) {
        console.error("Erreur lors de la récupération des produits Djoli:", error);
        return []; 
    }
};