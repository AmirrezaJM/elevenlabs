import { describe, it, expect, vi } from 'vitest';
import { makeQueryClient } from './query-client';
import { QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';

describe('makeQueryClient', () => {
  it('returns a QueryClient instance', () => {
    const client = makeQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  it('creates a new QueryClient on each call', () => {
    const client1 = makeQueryClient();
    const client2 = makeQueryClient();
    expect(client1).not.toBe(client2);
  });

  it('has a staleTime of 30 seconds', () => {
    const client = makeQueryClient();
    const defaultOptions = client.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(30 * 1000);
  });

  it('uses superjson.serialize for dehydration', () => {
    const client = makeQueryClient();
    const defaultOptions = client.getDefaultOptions();
    expect(defaultOptions.dehydrate?.serializeData).toBe(superjson.serialize);
  });

  it('uses superjson.deserialize for hydration', () => {
    const client = makeQueryClient();
    const defaultOptions = client.getDefaultOptions();
    expect(defaultOptions.hydrate?.deserializeData).toBe(superjson.deserialize);
  });

  it('dehydrates pending queries (shouldDehydrateQuery includes pending)', () => {
    const client = makeQueryClient();
    const defaultOptions = client.getDefaultOptions();
    const shouldDehydrateQuery = defaultOptions.dehydrate?.shouldDehydrateQuery;
    expect(shouldDehydrateQuery).toBeDefined();

    // A query with status 'pending' should be dehydrated
    const pendingQuery = {
      state: { status: 'pending' as const },
      queryHash: 'test',
      queryKey: ['test'],
      observers: [],
      getObserversCount: () => 0,
    };
    expect(shouldDehydrateQuery!(pendingQuery as Parameters<typeof shouldDehydrateQuery>[0])).toBe(true);
  });

  it('serializes and deserializes Date objects correctly via superjson', () => {
    const client = makeQueryClient();
    const defaultOptions = client.getDefaultOptions();
    const serialize = defaultOptions.dehydrate?.serializeData;
    const deserialize = defaultOptions.hydrate?.deserializeData;

    const original = { date: new Date('2024-01-15T00:00:00.000Z') };
    const serialized = serialize!(original);
    const deserialized = deserialize!(serialized);
    expect((deserialized as typeof original).date).toEqual(original.date);
  });
});