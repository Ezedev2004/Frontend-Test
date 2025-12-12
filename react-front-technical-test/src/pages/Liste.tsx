// src/pages/Liste.tsx (Mettez à jour ce fichier)

import { Table, Button, Spin, Alert } from "antd"; // Import de Spin et Alert
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchOrders, Order } from "../api/orderApi"; // Import de la fonction et de l'interface

function Liste() {
    // Utiliser l'interface Order pour le typage
    const [orders, setOrders] = useState<Order[]>([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadOrders = async () => {
            setLoading(true);
            setError(null);

            try {
                // Appel à l'API réelle
                const realOrders = await fetchOrders();
                setOrders(realOrders);
            } catch (err) {
                // Gérer l'erreur si le backend est inaccessible
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, []); // Dépendances vides : exécution une seule fois au montage

    // Colonnes du tableau (Typage optionnel pour plus de sécurité)
    const columns = [
        {
            title: "Client",
            dataIndex: "Nom",
        },
        {
            title: "Téléphone",
            dataIndex: "Téléphone", // Assurez-vous que c'est bien 'customer_phone' ou 'phone' selon votre Order interface
        },
        {
            title: "Montant total",
            dataIndex: "Montant_Total",
            // Formatage de la colonne pour afficher FCFA
            render: (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`, 
            sorter: (a: Order, b: Order) => a.total_amount - b.total_amount, // Permet le tri
        },
        {
            title: "Actions",
            // Utilisez le type Order ou any pour l'enregistrement
            render: (record: Order) => ( 
                <Link to={`/details/${record.id}`}>
                    <Button type="link" style={{ color: '#1890ff' }}>Voir détails</Button> 
                </Link>
            ),
        },
    ];

    // --- Rendu conditionnel ---

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <Spin size="large" tip="Chargement des commandes..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ margin: '20px auto', maxWidth: 800 }}>
                <Alert
                    message="Erreur de chargement"
                    description={error}
                    type="error"
                    showIcon
                />
                <Button onClick={() => window.location.reload()} style={{ marginTop: 15 }}>
                    Réessayer
                </Button>
            </div>
        );
    }
    
    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ paddingBottom: '10px', fontSize: '15px', fontWeight: 'bold' }}>Nombres de commandes ({orders.length})</h2>

            <Link to="/creation">
                <Button type="primary" style={{ marginBottom: "16px" }}>
                    Nouvelle commande
                </Button>
            </Link>

            <Table 
                dataSource={orders} 
                columns={columns} 
                rowKey="id"
                pagination={{ pageSize: 10 }} // Ajout de la pagination
            />
        </div>
    );
}

export default Liste;