'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

export interface GdsUiEvent {
  component: string;
  eventType: string;
  ts: number;
  correlationId: string;
  outcome?: 'success' | 'error' | 'info';
  context?: Record<string, string | number | boolean | null>;
}

export type GdsTelemetrySink = (event: GdsUiEvent) => void;

export interface GdsTelemetryProviderProps {
  children: ReactNode;
  sink?: GdsTelemetrySink;
  sampleRate?: number;
}

interface GdsTelemetryContextValue {
  emit: (event: Omit<GdsUiEvent, 'ts'>) => void;
}

const GdsTelemetryContext = createContext<GdsTelemetryContextValue | null>(null);

function hashToUnit(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function redactContext(context?: Record<string, string | number | boolean | null>) {
  if (!context) {
    return context;
  }
  return Object.entries(context).reduce<Record<string, string | number | boolean | null>>((acc, [key, value]) => {
    if (key.toLowerCase().includes('email') || key.toLowerCase().includes('name') || key.toLowerCase().includes('phone')) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}

export function GdsTelemetryProvider({ children, sink, sampleRate = 1 }: GdsTelemetryProviderProps) {
  const value = useMemo<GdsTelemetryContextValue>(() => ({
    emit: (event) => {
      if (hashToUnit(event.correlationId) > sampleRate) {
        return;
      }
      sink?.({
        ...event,
        context: redactContext(event.context),
        ts: Date.now(),
      });
    },
  }), [sampleRate, sink]);

  return <GdsTelemetryContext.Provider value={value}>{children}</GdsTelemetryContext.Provider>;
}

export function useGdsTelemetry() {
  const context = useContext(GdsTelemetryContext);
  if (!context) {
    throw new Error('useGdsTelemetry must be used within GdsTelemetryProvider.');
  }
  return context;
}
