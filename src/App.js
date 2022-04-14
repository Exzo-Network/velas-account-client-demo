import React from 'react';
import { observer } from 'mobx-react'
import { Layout, Avatar, Button, Menu, Dropdown } from 'antd';
import { UserOutlined, ShoppingCartOutlined, LogoutOutlined } from '@ant-design/icons';

import { Landing, Background } from './components'
import { useStores } from './store/RootStore'

import { vaclient }  from './functions/vaclient';

const { Header, Content } = Layout;

const App = observer(() => {
    const { authStore: { setCurrentSession, setError, logout, session } } = useStores();

    const processAuthResult = (err, authResult) => {
        if (authResult && authResult.access_token_payload) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setCurrentSession(authResult);
            return;
        } else if (err) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setError(err.description);
            return;
        };
    }

    const login = () => {
        vaclient.authorize({
            csrfToken: async function () {
                const response = await fetch(`${process.env.REACT_APP_SPONSOR_HOST}/csrf`);
                const result = await response.json();
                return result.token
            },
            scope: 'VelasAccountProgram:Transfer VelasAccountProgram:Execute EVM:Execute'
        }, processAuthResult);
    };

    const menu = () => {
        return <Menu><Menu.Item onClick={logout}><LogoutOutlined /><span> Logout </span></Menu.Item></Menu>
    };

    return (
        <div className="App">
            <Layout>
                <Background/>
                <Header>
                    <div className="header-components-wrapper">
                        <div className="left-nav">
                            <h1>Demo Donate</h1> 
                            <Button type="primary" onClick={()=> {window.location.href = 'https://account-demo-shop.testnet.velas.com'}} size={'large'}><ShoppingCartOutlined /> Demo Shop</Button>
                        </div>
                      

                        <div className="header-actions"> 
                            { session
                                ? <Dropdown overlay={menu} trigger={['click']}>
                                    <div>
                                        <Avatar icon={<UserOutlined />} />
                                        <span className="account-name">{session.access_token_payload.sub.slice(0,4)}..{session.access_token_payload.sub.substr(-4)}</span>
                                    </div>
                                  </Dropdown>
                                : <Button type="primary" onClick={login} size={'large'}><UserOutlined/> Login</Button>
                            }
                        </div>
                    </div>
                </Header>
                <Content>
                    <Landing/>
                </Content>
            </Layout>
      </div>
    );
});

export default App;
