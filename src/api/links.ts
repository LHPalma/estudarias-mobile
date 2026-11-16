import type { Link, Linked } from './types';

/** O link de uma ação, se a API o mandou. A ação só existe para o app quando o link existe. */
export function findLink(resource: Linked | null | undefined, rel: string): Link | undefined {
  return resource?.links.find((link) => link.rel === rel);
}

/** Se a ação está permitida no estado atual do recurso: é por isso que o app mostra ou esconde um botão. */
export function hasLink(resource: Linked | null | undefined, rel: string): boolean {
  return findLink(resource, rel) !== undefined;
}
