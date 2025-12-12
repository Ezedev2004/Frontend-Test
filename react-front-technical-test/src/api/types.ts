// src/api/types.ts

// --- 1. Structure de l'Article d'une Commande (OrderItem) ---
// Représente un produit spécifique dans le panier ou la commande enregistrée
export interface OrderItem {
    product_id_djoli: string; // L'ID du produit dans l'API Djoli (clé externe)
    product_name: string;      // Nom du produit
    quantity: number;          // Quantité commandée
    unit_price: number;        // Prix unitaire au moment de l'achat
    // Si votre backend renvoie un ID pour cet item spécifique, vous pouvez l'ajouter ici
    // id?: number;
}

// --- 2. Structure de l'Objet Commande Complet (Order) ---
// Représente une commande complète telle que stockée et renvoyée par l'API Laravel
export interface Order {
    id: number;
    client_name: string;
    client_phone: string;
    total_amount: number; // Montant total de la commande (calculé par le backend)
    items: OrderItem[]; 
    created_at?: string; // Date de création
    updated_at?: string; // Date de mise à jour
}

// --- 3. Structure des Données de Produit de l'API Djoli (ProductData) ---
// Représente la structure simplifiée d'un produit utilisé dans la page "Créer Commande"
export interface DjoliProduct {
    id: string; // ID du produit dans l'API Djoli
    name: string;
    price: number;
    unit_name: string;
}