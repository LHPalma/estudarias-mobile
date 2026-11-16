import { screen } from '@testing-library/react-native';

import { expectPath, openApp, rememberSession, resetDevice } from 'test-utils/app';

beforeEach(resetDevice);

describe('rotas', () => {
  it('sem sessão, o app abre no login', async () => {
    // Act
    await openApp('/');

    // Assert
    await expectPath('/login');
    expect(screen.getByRole('header', { name: 'Estudarias' })).toBeTruthy();
  });

  it('sem sessão, uma tela do app manda para o login', async () => {
    // Act
    await openApp('/trail');

    // Assert
    await expectPath('/login');
  });

  it('com sessão guardada, o app abre direto na trilha, dentro das abas', async () => {
    // Arrange
    await rememberSession();

    // Act
    await openApp('/');

    // Assert
    await expectPath('/trail');
    expect(await screen.findByText('Olá, Ana')).toBeTruthy();
    expect(screen.getAllByText('Revisão').length).toBeGreaterThan(0);
  });

  it('com sessão, o login manda para a trilha', async () => {
    // Arrange
    await rememberSession();

    // Act
    await openApp('/login');

    // Assert
    await expectPath('/trail');
  });
});

describe('galeria de componentes', () => {
  it('abre em desenvolvimento, com os componentes', async () => {
    // Act
    await openApp('/dev/components');

    // Assert
    await expectPath('/dev/components');
    expect(await screen.findByRole('header', { name: 'Componentes' })).toBeTruthy();
    expect(screen.getAllByRole('radio').length).toBe(8);
  });
});
