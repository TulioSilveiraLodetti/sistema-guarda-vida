import { saveAuth, getToken, getRole, clearAuth } from './auth';

beforeEach(() => {
  localStorage.clear();
});

test('salva e recupera token e perfil', () => {
  saveAuth('token-seguro', 'ADMIN');
  expect(getToken()).toBe('token-seguro');
  expect(getRole()).toBe('ADMIN');
});

test('limpa autenticacao ao sair', () => {
  saveAuth('token-seguro', 'PADRAO');
  clearAuth();
  expect(getToken()).toBeNull();
  expect(getRole()).toBeNull();
});
