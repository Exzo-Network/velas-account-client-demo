import { SystemProgram, PublicKey, Transaction, Connection, TransactionInstruction } from 'velas-solana-web3';

import BN from 'bn.js'; 

import React, { Component } from "react";
import ReactJson from 'react-json-view';
import { Spin, message, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { Login } from '../';
import { client_redirect_mode, client_popup_mode, client_direct_mode, agent }  from '../../functions/auth';

import Error from '../../components/Error';
import StakingComponent from '../../components/StakingComponent';

import './index.css';

const antIcon = <LoadingOutlined style={{ fontSize: 24, color: '#000000', }} spin />;

class Demo extends Component {

    state = {
        interaction: false,
        authorization: false,
        loading: true,
        error: false,
        transaction: {
            lamports: 1, //10000000000000000
        }
    };

    responseHandle = (response) => {
        if (response.redirect) {
            client_direct_mode.parseHash((err, authResult) => {
                if (authResult && authResult.access_token_payload) {
                    this.setState({ authorization: authResult, loading: false });
                } else if (err) {
                    this.setState({ error: err.description, loading: false });
                } else {
                    this.setState({ loading: false });
                }
            }, `?code=${response.redirect.code}&state=${response.redirect.state}`);

        } else {
            this.setState({error: 'something went wrong', loading: false});
        }
    };

    direct_login_store_key = async () => {
        this.setState({loading: true});
        const login_data = !this.state.interaction.sessions.length
            ? {
                mergeWithLastSubmission: false,
                // login: "9HpUb8bCUyUVZVmVRzceS5Bcp2daFbTQJYbX2Tr887Mw",
                // consent: { rejectedScopes: []},
                // merge: true,
            }
            : {
                mergeWithLastSubmission: false,
                select_account: this.state.interaction.sessions[0],
            }

        agent.finishInteraction(this.state.interaction.id, login_data)
        .then( (r) => this.responseHandle(r))
        .catch((e) => {console.log(e)})
    }

    direct_login = () => client_direct_mode.authorize({}, (err, authResult) => {
        if (authResult && authResult.interaction) {
            this.setState({ interaction: authResult.interaction, loading: false });
        } else if (err) {
            this.setState({ error: err.description, loading: false });
        } else {
            this.setState({ loading: false });
        };
    });

    transaction = async () => {
        const { authorization } = this.state;

        const instruction = SystemProgram.transfer({
            fromPubkey: new PublicKey(authorization.access_token_payload.ses),
            toPubkey:   new PublicKey(process.env.REACT_APP_BACKEND_ACCOUNT),
            lamports:   this.state.transaction.lamports,
        });

        // const vaccountPublicKey = new PublicKey(authorization.access_token_payload.sub);
        // const data = await agent.provider.client.account.getData(vaccountPublicKey);

        // console.log("data", data);

        // const transfer = new TransactionInstruction({
        //     programId: new PublicKey(process.env.REACT_APP_ACCOUNT_CONRACT),
        //     keys: [
        //         { pubkey: vaccountPublicKey, isSigner: false, isWritable: true },
        //         { pubkey: data.owner_current_storage, isSigner: false, isWritable: false },
        //         { pubkey: data.operation_current_storage, isSigner: false, isWritable: false },
        //         { pubkey: new PublicKey("EgJX7GpswpA8z3qRNuzNTgKKjPmw1UMfh5xQjFeVBqAK"), isSigner: false, isWritable: true },
        //         { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
        //         { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
          
        //         { pubkey: new PublicKey(authorization.access_token_payload.ses), isSigner: true, isWritable: false },
        //     ],
        //     data: Buffer.from(Uint8Array.of(6, ...new BN(100).toArray("le", 8)))
        // })

        const connection = new Connection(process.env.REACT_APP_NODE_HOST, 'singleGossip');

        const { blockhash: recentBlockhash } = await connection.getRecentBlockhash();

        const transaction = new Transaction({
            recentBlockhash,
            feePayer: new PublicKey(authorization.access_token_payload.ses),
        }).add(instruction);
        
        this.setState({loading: true})
        client_redirect_mode.sendTransaction( authorization.access_token, { transaction: transaction.serializeMessage() }, (err, result) => {
            console.log(err);
            if (err) {
                this.setState({loading: false})
                message.error({ content: err.description, duration: 5 });
            } else {
                this.setState({loading: false})
                message.success({ content: result.signature, duration: 5 });
            };
        });
    };

    redirect_login = () => client_redirect_mode.authorize();

    popup_login = () => client_popup_mode.authorize({}, (err, authResult) => {

        if (authResult && authResult.access_token_payload) {
            this.setState({ authorization: authResult, loading: false });
        } else if (err) {
            this.setState({ error: err.description, loading: false });
        } else {
            this.setState({ loading: false });
        };

        window.history.replaceState('', '', window.location.href.split('?')[0]);
    });

    componentDidMount() {
        client_redirect_mode.parseHash((err, authResult) => {

            if (authResult && authResult.access_token_payload) {
                this.setState({ authorization: authResult, loading: false });
            } else if (err) {
                this.setState({ error: err.description, loading: false });
            } else {
                this.setState({ loading: false });
            }

            window.history.replaceState('', '', window.location.href.split('?')[0]);
        });
    };

    render() {
        const { error, loading, authorization, interaction, transaction } = this.state;
        return (
            <div className="demo">
                { error && <Error error={error} /> }
                { !error && loading && <Spin indicator={antIcon} /> }
                { !error && !loading && !authorization && !interaction &&
                    <div>
                        {/* <Login mode='Popup'    login={this.popup_login}/> */}
                        <Login mode='Redirect' login={this.redirect_login}/>
                        {/* <Login mode='Direct'   login={this.direct_login}/> */}
                    </div>
                }
                { !error && !loading && authorization &&
                    <div>
                        {/* <h2>Success login</h2>
                        <ReactJson  displayObjectSize={false} displayDataTypes={false} theme='railscasts' src={authorization} /> */}

                        <StakingComponent authorization={authorization} client={client_redirect_mode}/>
                    </div>
                }

                { !error && !loading && interaction && !authorization &&
                    <div>
                        <h2>Interaction details</h2>
                        <ReactJson  displayObjectSize={false} displayDataTypes={false} theme='railscasts' src={interaction} />
                        <Login mode='Interaction' login={this.direct_login_store_key}/>
                    </div>
                }

                { !error && !loading && authorization &&
                    <div>
                        <br/>
                        <h2>Transfer Transaction:</h2>
                        <ReactJson  displayObjectSize={false} displayDataTypes={false} theme='railscasts' src={
                            {
                                from: authorization.access_token_payload.ses,
                                to: process.env.REACT_APP_BACKEND_ACCOUNT,
                                lamports: transaction.lamports,

                            }
                        } />
                        <br/>
                        <Button onClick={this.transaction} className="login-button" type="primary"  size={'large'}>
                            Transaction
                        </Button>
                        <br/><br/><br/>
                    </div>
                }
            </div>
        )
    };
};

export default Demo