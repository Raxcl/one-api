import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import { API, getLogo, showError, showInfo, showSuccess } from '../helpers';
import Turnstile from 'react-turnstile';

interface Inputs {
    username: string;
    password: string;
    password2: string;
    email: string;
    verification_code: string;
}

const RegisterForm: React.FC = () => {
    const [inputs, setInputs] = useState<Inputs>({
        username: '',
        password: '',
        password2: '',
        email: '',
        verification_code: '',
    });
    const { username, password, password2 } = inputs;
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [turnstileEnabled, setTurnstileEnabled] = useState(false);
    const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [loading, setLoading] = useState(false);
    const logo = getLogo();
    let affCode = new URLSearchParams(window.location.search).get('aff');
    if (affCode) {
        localStorage.setItem('aff', affCode);
    }

    useEffect(() => {
        let status = localStorage.getItem('status');
        if (status) {
            status = JSON.parse(status);
            setShowEmailVerification(status.email_verification);
            if (status.turnstile_check) {
                setTurnstileEnabled(true);
                setTurnstileSiteKey(status.turnstile_site_key);
            }
        }
    }, []);

    let navigate = useNavigate();

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        console.log(name, value);
        setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (password.length < 8) {
            showInfo('密码长度不得小于 8 位！');
            return;
        }
        if (password !== password2) {
            showInfo('两次输入的密码不一致');
            return;
        }
        if (username && password) {
            if (turnstileEnabled && turnstileToken === '') {
                showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
                return;
            }
            setLoading(true);
            if (!affCode) {
                affCode = localStorage.getItem('aff');
            }
            inputs.aff_code = affCode;
            const res = await API.post(`/api/user/register?turnstile=${turnstileToken}`, inputs);
            const { success, message } = res.data;
            if (success) {
                navigate('/login');
                showSuccess('注册成功！');
            } else {
                showError(message);
            }
            setLoading(false);
        }
    }

    const sendVerificationCode = async () => {
        if (inputs.email === '') return;
        if (turnstileEnabled && turnstileToken === '') {
            showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
            return;
        }
        setLoading(true);
        const res = await API.get(`/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`);
        const { success, message } = res.data;
        if (success) {
            showSuccess('验证码发送成功，请检查你的邮箱！');
        } else {
            showError(message);
        }
        setLoading(false);
    };

    return (
        <Grid textAlign='center' style={{ marginTop: '48px' }}>
    <Grid.Column style={{ maxWidth: 450 }}>
    <Header as='h2' color='' textAlign='center'>
    <Image src={logo} /> 新用户注册
    </Header>
    <Form size='large' onSubmit={handleSubmit}>
        <Segment>
            <Form.Input
                fluid
    icon='user'
    iconPosition='left'
    placeholder='输入用户名，最长 12 位'
    onChange={handleChange}
    name='username'
    value={username}
    />
    <Form.Input
    fluid
    icon='lock'
    iconPosition='left'
    placeholder='输入密码，最短 8 位，最长 20 位'
    onChange={handleChange}
    name='password'
    type='password'
    value={password}
    />
    <Form.Input
    fluid
    icon='lock'
    iconPosition='left'
    placeholder='输入密码，最短 8 位，最长 20 位'
    onChange={handleChange}
    name='password2'
    type='password'
    value={password2}
    />
    {showEmailVerification ? (
            <>
                <Form.Input
                    fluid
        icon='mail'
        iconPosition='left'
        placeholder='输入邮箱地址'
        onChange={handleChange}
        name='email'
        type='email'
        value={inputs.email}
        action={
            <Button onClick={sendVerificationCode} disabled={loading}>
        获取验证码
        </Button>
    }
        />
        <Form.Input
        fluid
        icon='lock'
        iconPosition='left'
        placeholder='输入验证码'
        onChange={handleChange}
        name='verification_code'
        value={inputs.verification_code}
        />
        </>
    ) : (
        <></>
    )}
    {turnstileEnabled ? (
            <Turnstile
                sitekey={turnstileSiteKey}
        onVerify={(token) => {
        setTurnstileToken(token);
    }}
        />
    ) : (
        <></>
    )}
    <Button color='green' fluid size='large' type='submit' loading={loading}>
        注册
        </Button>
        </Segment>
        </Form>
        <Message>
        已有账户？
          <Link to='/login' className='btn btn-link'>
        点击登录
        </Link>
        </Message>
        </Grid.Column>
        </Grid>
);
};

export default RegisterForm;