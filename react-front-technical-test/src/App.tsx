import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Liste from './pages/Liste';
import DetailCommande from './pages/DetailCommande';
import OrderForm from './pages/OrderForm';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <BrowserRouter>
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 8,
          }}
        />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <ShoppingOutlined />,
              // Renommé Accueil en "Liste des commandes" pour être plus clair
              label: <Link to="/">Liste des commandes</Link> 
          },
          {
              key: '2',
              icon: <ShoppingCartOutlined />,
              // Ce lien mène maintenant directement au formulaire de CRÉATION
              label: <Link to="/creation">Créer une commande</Link> 
          }
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px' }}
          />
          <h1 style={{ marginLeft: 16, fontSize: '20px' }}>Djoli</h1>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {/* Ici viendront les composants dynamiques */}
          <Routes>
          <Route path="/" element={<Liste />} />
    <Route path="/creation" element={<OrderForm />} />      {/* Création */}
    <Route path="/edition/:id" element={<OrderForm />} />   {/* Édition */} 
    <Route path="/details/:id" element={<DetailCommande />} />
    </Routes>
        </Content>
      </Layout>
    </Layout>
    </BrowserRouter>
  );
};

export default App;
