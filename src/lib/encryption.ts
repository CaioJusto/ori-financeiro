import crypto from 'crypto';

// IMPORTANTE: Em produção, use variáveis de ambiente
// Gere uma chave forte com: openssl rand -hex 32
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-change-in-production!!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Gera uma chave derivada usando PBKDF2
 */
function getKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
}

/**
 * Criptografa dados sensíveis usando AES-256-GCM
 * @param text Texto a ser criptografado
 * @returns String em base64 contendo salt + iv + tag + dados criptografados
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Concatena: salt + iv + tag + dados criptografados
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString('base64');
}

/**
 * Descriptografa dados sensíveis
 * @param encryptedData String em base64 contendo salt + iv + tag + dados
 * @returns Texto descriptografado
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  try {
    const buffer = Buffer.from(encryptedData, 'base64');

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = buffer.subarray(ENCRYPTED_POSITION);

    const key = getKey(salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(encrypted) + decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia de dados sensíveis');
  }
}

/**
 * Hash de senha usando bcrypt (para senhas)
 * Nota: Use bcrypt para senhas, não esta função de criptografia
 */
export function hashPassword(password: string): string {
  // Usar bcrypt (já está implementado no projeto)
  const bcrypt = require('bcryptjs');
  return bcrypt.hashSync(password, 10);
}

/**
 * Máscara de CPF para exibição
 * @param cpf CPF completo
 * @returns CPF mascarado (ex: ***.456.789-**)
 */
export function maskCPF(cpf: string): string {
  if (!cpf || cpf.length !== 11) return cpf;
  return `***${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`;
}

/**
 * Máscara de cartão de crédito
 * @param cardNumber Número completo do cartão
 * @returns Número mascarado (ex: **** **** **** 1234)
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  const lastFour = cardNumber.slice(-4);
  return `**** **** **** ${lastFour}`;
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

/**
 * Campos que devem ser criptografados no banco de dados
 */
export const ENCRYPTED_FIELDS = [
  'cpf',
  'cnpj',
  'accountNumber',
  'bankAccountNumber',
  'cardNumber',
  'cvv',
  'taxId',
  'ssn',
  'passport',
] as const;

/**
 * Verifica se um campo deve ser criptografado
 */
export function shouldEncrypt(fieldName: string): boolean {
  return ENCRYPTED_FIELDS.includes(fieldName as any);
}
