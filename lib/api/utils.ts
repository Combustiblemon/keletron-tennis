import { z } from 'zod';

import { CourtValidator, CourtValidatorPartial } from '@/models/Court';

export const isLoggedIn = (): boolean => {
  return true;
};

export const isAdmin = (): boolean => {
  return isLoggedIn() && true;
};

export const isUser = (): boolean => {
  return true;
};

export const isOwner = (): boolean => {
  return true;
};

export const getUser = () => {
  return { id: '1', email: '', type: 'USER' };
};

const commonHeaders = {
  'Content-Type': 'application/json',
};

export const endpoints = {
  courts: (id: string) => ({
    GET: async () =>
      fetch(`/api/courts${id ? `/${id}` : ''}`, {
        method: 'GET',
        headers: commonHeaders,
      }),
    POST: async (body: z.infer<typeof CourtValidator>) =>
      fetch('/api/courts', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify(body),
      }),
    PUT: async (body: z.infer<typeof CourtValidatorPartial>) =>
      fetch(`/api/courts/${id ? `/${id}` : ''}`, {
        method: 'PUT',
        headers: commonHeaders,
        body: JSON.stringify(body),
      }),
    DELETE: async (): Promise<Response | null> => {
      if (!id) {
        return null;
      }

      return fetch(`/api/courts/${id}`, {
        method: 'DELETE',
        headers: commonHeaders,
      });
    },
  }),
};
