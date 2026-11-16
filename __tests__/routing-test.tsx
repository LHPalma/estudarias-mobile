import { renderRouter, screen } from 'expo-router/testing-library';

describe('rotas iniciais', () => {
  it('abre no login, porque ainda não há sessão', async () => {
    // Arrange & Act
    await renderRouter('./src/app', { initialUrl: '/' });

    // Assert
    expect(screen).toHavePathname('/login');
    expect(screen.getByRole('header', { name: 'Estudarias' })).toBeTruthy();
  });

  it('a trilha fica dentro das abas, com Trilha e Revisão', async () => {
    // Arrange & Act
    await renderRouter('./src/app', { initialUrl: '/trail' });

    // Assert
    expect(screen).toHavePathname('/trail');
    expect(screen.getByRole('header', { name: 'Trilha' })).toBeTruthy();
    expect(screen.getAllByText('Revisão').length).toBeGreaterThan(0);
  });
});

describe('galeria de componentes', () => {
  it('abre em desenvolvimento, com os componentes', async () => {
    // Arrange & Act
    await renderRouter('./src/app', { initialUrl: '/dev/components' });

    // Assert
    expect(screen).toHavePathname('/dev/components');
    expect(screen.getByRole('header', { name: 'Componentes' })).toBeTruthy();
    expect(screen.getAllByRole('radio').length).toBe(8);
  });
});
