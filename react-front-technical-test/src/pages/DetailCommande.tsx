import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Table, Typography, Spin, Alert, Button, Popconfirm, notification } from "antd"; 
import { DeleteOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
// Import des fonctions et types depuis votre API
import { fetchOrderById, deleteOrder, Order, OrderItem } from "../api/orderApi"; 

const { Title, Text } = Typography;

// --- Colonnes du Tableau des Articles ---
const itemColumns = [
    {
        title: 'Produit',
        dataIndex: 'product_name',
        // Fallback si Laravel renvoie 'Nom_du_produit'
        render: (text: string, record: any) => record.Nom_du_produit || text,
    },
    {
        title: 'Prix Unitaire',
        dataIndex: 'unit_price',
        // Fallback si Laravel renvoie 'Prix_unitaire'
        render: (price: number, record: any) => {
            const finalPrice = record.Prix_unitaire || price;
            return `${(finalPrice || 0).toLocaleString('fr-FR')} FCFA`;
        },
    },
    {
        title: 'Quantité',
        dataIndex: 'quantity',
        // Fallback si Laravel renvoie 'Quantité'
        render: (quantity: number, record: any) => record.Quantité || quantity,
    },
    {
        title: 'Total Ligne',
        key: 'total_line',
        render: (record: any) => {
            const quantity = record.Quantité || record.quantity || 0;
            const price = record.Prix_unitaire || record.unit_price || 0;
            return (quantity * price).toLocaleString('fr-FR') + ' FCFA';
        },
    },
];


const DetailCommande: React.FC = () => {
    const { id } = useParams<{ id: string }>(); 
    const navigate = useNavigate();

    // On utilise 'any' ici pour pouvoir accéder aux clés potentiellement en PascalCase/Snake_Case de Laravel
    const [order, setOrder] = useState<any | null>(null); 
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Logique de Chargement de la Commande ---
    useEffect(() => {
        const loadOrderDetails = async () => {
            if (!id) {
                setError("ID de commande manquant dans l'URL.");
                setLoading(false);
                return;
            }
            
            // L'ID est toujours un string dans l'URL, le convertir en nombre est plus sûr.
            const orderId = parseInt(id, 10); 
            if (isNaN(orderId)) {
                setError("ID de commande invalide.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                // Utilisation de l'ID numérique
                const data = await fetchOrderById(orderId);
                setOrder(data); 
            } catch (err) {
                console.error("Erreur de chargement des détails:", err);
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        loadOrderDetails();
    }, [id]);

    // --- Fonction de Suppression ---
    const handleDelete = async () => {
        if (!order || !order.id) return;
        
        setDeleting(true);
        try {
            await deleteOrder(order.id);
            
            notification.success({
                message: 'Suppression Réussie',
                description: `La commande #${order.id} a été définitivement supprimée.`,
                placement: 'topRight',
            });
            
            // Redirection vers la liste des commandes après suppression
            navigate('/'); 

        } catch (err) {
            let errorMessage = "Échec de la suppression sur le serveur.";
            if (err instanceof Error) {
                 errorMessage = err.message;
            } 
            
            notification.error({
                message: 'Erreur de Suppression',
                description: errorMessage,
                placement: 'topRight',
            });
        } finally {
            setDeleting(false);
        }
    };
    
    // --- Rendu conditionnel et Messages d'Erreur/Chargement ---
    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <Spin size="large" tip={`Chargement de la commande #${id}...`} />
            </div>
        );
    }
    
    if (error) {
        return (
            <div style={{ margin: '20px auto', maxWidth: 800 }}>
                <Alert
                    message="Erreur de Chargement"
                    description={`Impossible de charger les détails de la commande #${id}. ${error}`}
                    type="error"
                    showIcon
                    action={<Button size="small" onClick={() => navigate('/')}>Retour à la liste</Button>}
                />
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ margin: '20px auto', maxWidth: 800 }}>
                 <Alert
                    message="Commande Introuvable"
                    description={`Aucune commande trouvée avec l'ID #${id}.`}
                    type="warning"
                    showIcon
                    action={<Button size="small" onClick={() => navigate('/')}>Retour à la liste</Button>}
                />
            </div>
        );
    }

    // Extraction des clés pour la robustesse (Nom, Téléphone, Montant_Total sont les clés probables de Laravel)
    const clientName = order.Nom || order.client_name || 'N/A';
    const clientPhone = order.Téléphone || order.client_phone || 'N/A';
    const totalAmount = order.Montant_Total || order.total_amount || 0;
    const createdAt = order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : 'N/A';
    
    // Le tableau d'articles est souvent sous la clé 'items' ou 'order_items'
    const dataSource = order.items || [];
    
    // --- Rendu Final ---
    return (
        <Card 
            title={<Title level={3}>Détail de la Commande #{order.id}</Title>} 
            style={{ margin: '20px auto', maxWidth: 1000 }}
            extra={
                <div style={{ display: 'flex', gap: 10 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
                        Retour à la liste
                    </Button>

                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={() => navigate(`/edition/${order.id}`)}
                    >
                        Modifier la commande
                    </Button>
                    
                    {/* Popconfirm pour la suppression sécurisée */}
                    <Popconfirm
                        title="Confirmation de Suppression"
                        description={`Êtes-vous sûr de vouloir supprimer la commande #${order.id} ? Cette action est irréversible.`}
                        onConfirm={handleDelete}
                        okText="Oui, Supprimer"
                        cancelText="Annuler"
                        placement="bottomRight"
                        okButtonProps={{ danger: true, loading: deleting }}
                    >
                        <Button 
                            danger 
                            icon={<DeleteOutlined />} 
                            loading={deleting}
                        >
                            Supprimer
                        </Button>
                    </Popconfirm>
                </div>
            }
        >
            
            <Title level={4}>Informations Client</Title>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
                <Descriptions.Item label="Nom du Client">
                    <Text strong>{clientName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Téléphone">
                    <Text>{clientPhone}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Date de Création">
                    <Text>{createdAt}</Text>
                </Descriptions.Item>
            </Descriptions>

            <Title level={4} style={{ marginTop: 30 }}>Articles Commandés</Title>
            
            {dataSource.length === 0 ? (
                <Alert message="Aucun article trouvé pour cette commande." type="info" />
            ) : (
                <Table
                    dataSource={dataSource}
                    columns={itemColumns}
                    rowKey={(record: any) => record.id || record.produit_id_djoli + record.Quantité} 
                    pagination={false}
                    summary={() => (
                        <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                            <Table.Summary.Cell index={0} colSpan={3}>
                                <Text strong style={{ fontSize: '1.2em' }}>TOTAL GLOBAL</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3}>
                                <Text strong style={{ fontSize: '1.4em', color: '#faad14' }}>
                                    {totalAmount.toLocaleString('fr-FR')} FCFA
                                </Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            )}
        </Card>
    );
};

export default DetailCommande;