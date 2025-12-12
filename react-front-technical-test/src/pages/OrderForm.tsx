import React, { useState, useEffect, useCallback } from 'react';
import { Form, Select, Input, InputNumber, Button, Card, Table, Typography, Spin, Alert, notification } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    createOrder, 
    fetchOrderById, 
    updateOrder, 
    OrderItem, 
    ProductData, 
    Order 
} from '../api/orderApi'; 

const { Option } = Select;
const { Title, Text } = Typography;

// --- API Externe (Djoli) ---
const DJOLI_API_URL = "https://api-preprod.djoli.africa/api/v1/rest/mobile/catalog/products-standards?per_page=100";

// --- Types Locaux ---
interface CartItem {
    key: number;
    product_id_djoli: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    unit_name: string;
}

const OrderForm: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); 
    const isEditing = !!id; // Détermine si nous sommes en mode édition

    // États pour l'API Djoli
    const [products, setProducts] = useState<ProductData[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);

    // États pour le panier et la soumission
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing); // Charger les données initiales en mode édition

    // --- 1. Récupération des produits de l'API Djoli ---
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const res = await axios.get(DJOLI_API_URL);
                const apiData = res.data?.data?.data; 
                
                if (!Array.isArray(apiData)) {
                    throw new Error("La structure de la réponse de l'API Djoli n'est pas celle attendue.");
                }

                const formattedProducts: ProductData[] = apiData.map((p: any) => ({
                    id: String(p.id),
                    name: p.name,
                    price: parseFloat(p.price ?? 0), 
                    unit_name: p.unit?.translation?.title ?? 'KG'
                }));

                setProducts(formattedProducts);
                setErrorProducts(null); 
            } catch (err) {
                const errorDetail = err instanceof Error ? err.message : "Erreur inconnue";
                console.error("Erreur de l'API Djoli:", errorDetail);
                setErrorProducts(`Erreur lors du chargement des produits: ${errorDetail}`);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, []);

    // --- 2. Chargement des données de la commande pour l'édition ---
    useEffect(() => {
        if (!isEditing || !id) return;

        const loadOrderForEdit = async () => {
            setInitialLoading(true);
            try {
                const orderId = parseInt(id, 10);
                const orderData: any = await fetchOrderById(orderId);

                // Initialiser le formulaire client (en utilisant les clés de fallback)
                form.setFieldsValue({
                    client_name: orderData.Nom || orderData.client_name,
                    client_phone: orderData.Téléphone || orderData.client_phone,
                    // Réinitialiser les champs d'ajout de produit
                    product_id: undefined,
                    quantity: 1,
                });

                // Initialiser le panier (mapper les clés Laravel vers CartItem)
                const itemsToCart: CartItem[] = (orderData.items || []).map((item: any, index: number) => ({
                    // Utiliser l'index ou l'ID si disponible pour la clé
                    key: item.id || Date.now() + index, 
                    product_id_djoli: item.product_id_djoli || item.produit_id_djoli,
                    product_name: item.Nom_du_produit || item.product_name, // Clé de fallback
                    unit_price: item.Prix_unitaire || item.unit_price,
                    quantity: item.Quantité || item.quantity,
                    unit_name: 'KG', // Peut nécessiter une vérification si l'unité est stockée
                }));
                
                setCartItems(itemsToCart);
                
            } catch (error) {
                console.error("Erreur lors du chargement de la commande à éditer:", error);
                notification.error({
                    message: `Erreur de chargement de la commande #${id}`,
                    description: "Impossible de récupérer les données pour l'édition.",
                });
                navigate('/'); // Rediriger si le chargement échoue
            } finally {
                setInitialLoading(false);
            }
        };

        loadOrderForEdit();
    }, [id, isEditing, form, navigate]);

    // --- 3. Gestion de l'ajout d'un article au panier ---
    const handleAddProduct = () => {
        const { product_id, quantity } = form.getFieldsValue(['product_id', 'quantity']);

        if (!product_id || !quantity || quantity <= 0) {
            notification.warning({
                message: "Information Manquante",
                description: "Veuillez sélectionner un produit et entrer une quantité valide.",
                placement: 'topRight',
            });
            return;
        }

        const selectedProduct = products.find(p => p.id === product_id);
        if (!selectedProduct) return;

        // Vérifier si le produit est déjà dans le panier
        const existingItemIndex = cartItems.findIndex(item => item.product_id_djoli === product_id);

        if (existingItemIndex > -1) {
             // Si l'article existe, mettre à jour la quantité
             const updatedCart = [...cartItems];
             updatedCart[existingItemIndex].quantity += quantity;
             setCartItems(updatedCart);
        } else {
            // Si l'article n'existe pas, l'ajouter
            const newItem: CartItem = {
                key: Date.now(), // Clé unique pour Antd Table
                product_id_djoli: selectedProduct.id,
                product_name: selectedProduct.name,
                unit_price: selectedProduct.price,
                quantity: quantity,
                unit_name: selectedProduct.unit_name,
            };
            setCartItems([...cartItems, newItem]);
        }

        // Réinitialiser les champs de sélection après ajout
        form.setFieldsValue({ product_id: undefined, quantity: 1 });
    };

    // --- 4. Gestion de la suppression d'un article du panier ---
    const handleDeleteItem = (key: number) => {
        setCartItems(cartItems.filter(item => item.key !== key));
    };

    // --- 5. Calcul du Montant Total du Panier ---
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // --- 6. Logique de soumission de la Commande Finale (Création ou Édition) ---
    const onFinish = async (values: any) => {
        if (cartItems.length === 0) {
            notification.warning({
                message: 'Panier Vide',
                description: 'Veuillez ajouter au moins un article à la commande.',
                placement: 'topRight',
            });
            return;
        }

        // Préparer le payload pour l'API Laravel (utiliser les noms de champs du backend : product_name, unit_price, quantity, etc.)
        const itemsPayload: OrderItem[] = cartItems.map(item => ({
            product_id_djoli: item.product_id_djoli,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            // Si votre Laravel s'attend à 'Nom_du_produit' au lieu de 'product_name', vous devriez mapper ici.
        }));

        const finalPayload: Omit<Order, 'id' | 'total_amount' | 'created_at' | 'updated_at'> = {
            // Utilisation des noms de champs du frontend pour le payload
            client_name: values.client_name, 
            client_phone: values.client_phone,
            items: itemsPayload,
        };

        setSubmitting(true);
        try {
            let resultOrder: any;
            let successMessage: string;
            
            if (isEditing && id) {
                // MODE ÉDITION (PUT)
                resultOrder = await updateOrder(parseInt(id, 10), finalPayload as any);
                successMessage = `La commande #${resultOrder.id} a été mise à jour avec succès.`;

            } else {
                // MODE CRÉATION (POST)
                resultOrder = await createOrder(finalPayload as any);
                const clientName = resultOrder.Nom || resultOrder.client_name || 'Client';
                const formattedAmount = (resultOrder.Montant_Total || resultOrder.total_amount || 0).toLocaleString('fr-FR');
                successMessage = `La commande #${resultOrder.id} a été créée pour ${clientName}. Montant: ${formattedAmount} FCFA.`;
            }

            // --- GESTION DU SUCCÈS ---
            notification.success({
                message: isEditing ? 'Modification Réussie' : 'Commande Enregistrée',
                description: successMessage,
                placement: 'topRight',
                duration: 5,
            });

            // Rediriger vers la liste après succès
            navigate('/'); 

        } catch (error) {
            // --- GESTION DES ERREURS ---
            let errorMessage = "Une erreur est survenue lors de l'enregistrement sur le serveur.";
            if (error instanceof Error) {
                 errorMessage = error.message; 
            } 
            
            notification.error({
                message: isEditing ? 'Erreur de Modification' : 'Erreur Serveur',
                description: errorMessage,
                placement: 'topRight',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // --- Configuration des colonnes du panier ---
    const cartColumns = [
        {
            title: 'Produit',
            dataIndex: 'product_name',
            key: 'product_name',
        },
        {
            title: 'Prix Unitaire',
            dataIndex: 'unit_price',
            key: 'unit_price',
            render: (price: number) => `${price.toLocaleString('fr-FR')} FCFA`,
        },
        {
            title: 'Quantité',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'center' as const,
        },
        {
            title: 'Total Ligne',
            key: 'total_line',
            render: (record: CartItem) => (record.quantity * record.unit_price).toLocaleString('fr-FR') + ' FCFA',
        },
        {
            title: 'Action',
            key: 'action',
            render: (record: CartItem) => (
                <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteItem(record.key)}
                    aria-label={`Supprimer ${record.product_name}`}
                />
            ),
            width: 80,
            align: 'center' as const,
        },
    ];

    // --- Rendu conditionnel des produits Djoli ---
    if (loadingProducts || initialLoading) {
        const tip = isEditing && initialLoading ? `Chargement de la commande #${id} pour édition...` : "Chargement des produits Djoli...";
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <Spin size="large" tip={tip} />
            </div>
        );
    }

    if (errorProducts) {
        return (
            <div style={{ margin: '20px auto', maxWidth: 800 }}>
                <Alert
                    message="Erreur de catalogue"
                    description={errorProducts}
                    type="error"
                    showIcon
                    action={<Button onClick={() => window.location.reload()} style={{ marginTop: 15 }}>Réessayer</Button>}
                />
            </div>
        );
    }

    // --- Rendu principal ---
    return (
        <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditing ? `Modifier la Commande #${id}` : 'Créer une Nouvelle Commande'}
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
                    Retour à la liste
                </Button>
            </Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ quantity: 1 }}
            >
                {/* --- Bloc 1: Informations Client --- */}
                <Card title="Informations Client" style={{ marginBottom: 20 }}>
                    <Form.Item
                        name="client_name"
                        label="Nom du Client"
                        rules={[{ required: true, message: "Veuillez entrer le nom du client." }]}
                    >
                        <Input placeholder="Ex: Adama Coulibaly" />
                    </Form.Item>
                    <Form.Item
                        name="client_phone"
                        label="Téléphone du Client"
                        rules={[{ required: true, message: "Veuillez entrer le numéro de téléphone." }]}
                    >
                        <Input placeholder="Ex: 0707070707" />
                    </Form.Item>
                </Card>

                {/* --- Bloc 2: Ajout d'Articles --- */}
                <Card title="Ajouter / Modifier des Articles" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                        <Form.Item
                            name="product_id"
                            label="Produit"
                            style={{ flexGrow: 3, minWidth: 200 }}
                            rules={[{ message: "Sélectionnez un produit." }]}
                        >
                            <Select
                                showSearch
                                placeholder="Sélectionner un produit"
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {products.map(p => (
                                    <Option key={p.id} value={p.id}>
                                        {p.name} ({p.price.toLocaleString('fr-FR')} FCFA / {p.unit_name})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="quantity"
                            label="Quantité"
                            style={{ flexGrow: 1, minWidth: 100 }}
                            rules={[{ required: true, message: "Quantité requise." }]}
                        >
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={handleAddProduct}
                            style={{ marginBottom: 24 }}
                            disabled={loadingProducts}
                        >
                            Ajouter / Mettre à jour
                        </Button>
                    </div>
                </Card>

                {/* --- Bloc 3: Panier (Tableau des articles) --- */}
                <Card title="Panier de la Commande">
                    <Table
                        dataSource={cartItems}
                        columns={cartColumns}
                        rowKey="key"
                        pagination={false}
                        locale={{ emptyText: "Le panier est vide. Veuillez ajouter des produits ci-dessus." }}
                        summary={() => (
                            <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                    <Text strong style={{ fontSize: '1.2em' }}>Montant Total de la Commande</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3} colSpan={2}>
                                    <Text strong style={{ fontSize: '1.4em', color: '#faad14' }}>
                                        {totalAmount.toLocaleString('fr-FR')} FCFA
                                    </Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        )}
                    />
                </Card>

                {/* --- Bouton de Soumission --- */}
                <Form.Item style={{ marginTop: 20, textAlign: 'right' }}>
                    <Button 
                        type="primary" 
                        size="large"
                        htmlType="submit"
                        loading={submitting}
                        disabled={cartItems.length === 0 || submitting}
                        icon={isEditing ? <SaveOutlined /> : <PlusOutlined />}
                    >
                        {submitting 
                            ? (isEditing ? 'Mise à jour...' : 'Enregistrement...') 
                            : (isEditing ? 'Enregistrer les modifications' : 'Enregistrer la Commande')}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default OrderForm;