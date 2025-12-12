# Frontend-Test
Frontend projet test Djoli

## Lancement du Frontend (React)
```bash
cd react-front-technical-test
npm install
npm run dev
# ou
yarn install
yarn dev
```

## Documentation de l'Usage de l'IA
### Utilisation de Gemini
Prompt : "donne moi le code react pour un formulaire de création de commande avec ant design, gestion d'un panier dynamique et intégration d'un select d'API externe."

Génération du Squelette : Création de la structure de base de OrderForm.tsx, incluant l'intégration des hooks useState pour le panier (cartItems) et la gestion des formulaires Ant Design.

Le squelette généré a été utilisé comme base, puis adapté pour gérer les modes Création/Édition et le typage TypeScript.

Prompt : "comment implémenter la modification et la suppression d'une commande dans le composant DetailCommande.tsx, en utilisant Popconfirm et l'API axios."

Mise en place du flux d'édition et de suppression : Création des fonctions deleteOrder et des boutons de redirection vers /edition/:id dans DetailCommande.tsx

Intégration des fonctions deleteOrder et updateOrder dans orderApi.ts et lien avec les vues Ant Design.

Prompt : "la création fonctionnait mais ne fonctionne plus après avoir corrigé la modification, pourquoi?"

Correction du conflit createOrder vs updateOrder : Identification que le mappage strict appliqué à updateOrder avait cassé la logique tolérante de createOrder

Séparation des formats de payload dans createOrder (retour au format tolérant) et updateOrder (conservation du format strict) dans orderApi.ts.