import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type TicketStatus = 'waiting' | 'called' | 'cancelled';

export interface Reason {
  id: string;
  label: string;
}

export interface Ticket {
  id: string;
  reason: string;
  status: TicketStatus;
  position: number;
  estimatedWaitMinutes: number;
}

const TIMEOUT_MS = 8_000;

function baseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:3000`;

  // Sur l'émulateur Android, localhost désigne l'émulateur.
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export function fetchReasons(): Promise<Reason[]> {
  return request('/reasons');
}

export function createTicket(reason: string): Promise<Ticket> {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function fetchTicket(id: string, signal?: AbortSignal): Promise<Ticket> {
  return request(`/tickets/${encodeURIComponent(id)}`, { signal });
}

export function cancelTicket(id: string): Promise<Ticket> {
  return request(`/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Phrase à afficher. Jamais de code HTTP, de stack, ni de message technique. */
export function toUserMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue. Réessayez.';
  if (error.name === 'AbortError') return 'Le serveur met trop de temps à répondre. Réessayez.';

  const message = error.message.trim();
  if (!message || looksTechnical(message) || error.name === 'TypeError') {
    return "Impossible de joindre le serveur. Vérifiez que l'API est lancée, puis réessayez.";
  }
  return message;
}

function readApiMessage(body: unknown): string {
  if (!body || typeof body !== 'object' || !('error' in body)) return '';
  const value = (body as { error: unknown }).error;
  return typeof value === 'string' ? value.trim() : '';
}

function messageForStatus(status: number, apiMessage: string): string {
  if (status === 400 && apiMessage.toLowerCase().includes('obligatoire')) {
    return 'Choisissez un motif avant de rejoindre la file.';
  }
  if (status === 400) return "Ce motif n'est pas reconnu. Choisissez-en un dans la liste.";
  if (status === 404) return "Votre place dans la file est introuvable.";
  if (status === 409) return 'Vous ne pouvez plus quitter la file.';
  if (status >= 500) return 'Le service est momentanément indisponible. Réessayez dans un instant.';
  return 'Une erreur est survenue. Réessayez.';
}

function looksTechnical(message: string): boolean {
  return /[{}[\]<>]|erreur\s+\d{3}|\b(typeerror|syntaxerror|fetch|json|undefined|status|network)\b|https?:\/\//i.test(
    message,
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const parent = init?.signal;
  const abortFromParent = () => controller.abort();

  if (parent?.aborted) controller.abort();
  else parent?.addEventListener('abort', abortFromParent);

  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: controller.signal,
    });

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(messageForStatus(response.status, readApiMessage(body)));
    }
    if (body == null) throw new Error('Le serveur a renvoyé une réponse incompréhensible. Réessayez.');
    return body as T;
  } catch (error) {
    if (parent?.aborted) throw error;
    throw new Error(toUserMessage(error));
  } finally {
    clearTimeout(timeout);
    parent?.removeEventListener('abort', abortFromParent);
  }
}
