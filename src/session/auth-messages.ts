import { ApiError, NetworkError } from '@/api/errors';

/** O que o aluno lê para cada `code` de erro dos endpoints de sessão. A mensagem do servidor é para quem desenvolve. */
const MESSAGES: Record<string, string> = {
  'identity.credentials.invalid': 'E-mail ou senha incorretos.',
  'identity.email.taken': 'Este e-mail já tem conta. Entre com ele.',
  'identity.email.invalid': 'Digite um e-mail válido.',
  'identity.password.tooShort': 'A senha precisa ter pelo menos 8 caracteres.',
  'identity.password.tooLong': 'A senha pode ter no máximo 128 caracteres.',
  'identity.password.noUppercase': 'A senha precisa ter uma letra maiúscula.',
  'identity.password.noLowercase': 'A senha precisa ter uma letra minúscula.',
  'identity.password.noDigit': 'A senha precisa ter um número.',
  'identity.password.noSpecial': 'A senha precisa ter um símbolo, como @ ou #.',
  'student.name.required': 'Digite o seu nome.',
  'student.name.tooLong': 'O nome está longo demais.',
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  }
  if (error instanceof ApiError && error.code && MESSAGES[error.code]) {
    return MESSAGES[error.code];
  }
  return 'Não foi possível concluir. Tente de novo.';
}

export const NOTICE_MESSAGES = {
  expired: 'Sua sessão expirou. Entre de novo.',
  offline: 'Sem conexão com o servidor. Entre de novo quando a internet voltar.',
} as const;
