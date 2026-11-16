import { fireEvent, screen } from '@testing-library/react-native';

import { expectPath, openApp, rememberSession, resetDevice, signIn } from 'test-utils/app';

beforeEach(resetDevice);

describe('login', () => {
  it('com e-mail e senha certos, entra e vai para a trilha', async () => {
    // Arrange
    await openApp('/login');

    // Act
    await signIn();

    // Assert
    await expectPath('/trail');
    expect(await screen.findByText('Olá, Ana')).toBeTruthy();
  });

  it('com a senha errada, fica no login e diz o que houve', async () => {
    // Arrange
    await openApp('/login');

    // Act
    await signIn('ana@example.com', 'errada');

    // Assert
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeTruthy();
    expect(screen).toHavePathname('/login');
    expect(screen.getByRole('button', { name: 'Entrar' })).not.toBeDisabled();
  });

  it('uma sessão guardada que o servidor recusa volta ao login com o aviso', async () => {
    // Arrange: o token de uma conta que o servidor não conhece mais.
    await rememberSession('sumiu@example.com');

    // Act
    await openApp('/trail');

    // Assert
    await expectPath('/login');
    expect(await screen.findByText('Sua sessão expirou. Entre de novo.')).toBeTruthy();
  });
});

describe('cadastro', () => {
  async function register(name: string, email: string, password: string) {
    await fireEvent.press(await screen.findByRole('button', { name: 'Ainda não tenho conta' }));
    await fireEvent.changeText(await screen.findByLabelText('Nome'), name);
    await fireEvent.changeText(screen.getByLabelText('E-mail'), email);
    await fireEvent.changeText(screen.getByLabelText('Senha'), password);
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta e começar' }));
  }

  it('cria a conta e já entra na trilha', async () => {
    // Arrange
    await openApp('/login');

    // Act
    await register('Lucas', 'lucas@example.com', 'Senha@123');

    // Assert
    await expectPath('/trail');
    expect(await screen.findByText('Olá, Lucas')).toBeTruthy();
  });

  it('com um e-mail que já tem conta, diz para entrar com ele', async () => {
    // Arrange
    await openApp('/login');

    // Act
    await register('Ana', 'ana@example.com', 'Senha@123');

    // Assert
    expect(await screen.findByText('Este e-mail já tem conta. Entre com ele.')).toBeTruthy();
    expect(screen).toHavePathname('/register');
  });

  it('com a senha curta, diz a regra', async () => {
    // Arrange
    await openApp('/login');

    // Act
    await register('Lucas', 'lucas@example.com', 'curta');

    // Assert
    expect(await screen.findByText('A senha precisa ter pelo menos 8 caracteres.')).toBeTruthy();
  });
});

describe('sair', () => {
  it('volta ao login e não deixa a sessão guardada', async () => {
    // Arrange
    await rememberSession();
    await openApp('/');
    await expectPath('/trail');

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: 'Sair da conta' }));

    // Assert
    await expectPath('/login');
    expect(screen.queryByText('Sua sessão expirou. Entre de novo.')).toBeNull();
  });
});
