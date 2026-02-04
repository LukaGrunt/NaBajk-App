import { parseCoordinatesInput } from './coordinates';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTitle(title: string): ValidationResult {
  const trimmed = title.trim();
  if (!trimmed) {
    return { valid: false, error: 'Title is required' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Title must be at least 3 characters' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Title is too long (max 100 characters)' };
  }
  return { valid: true };
}

export function validateMeetingPoint(point: string): ValidationResult {
  const trimmed = point.trim();
  if (!trimmed) {
    return { valid: false, error: 'Meeting point is required' };
  }
  if (trimmed.length > 200) {
    return { valid: false, error: 'Meeting point is too long (max 200 characters)' };
  }
  return { valid: true };
}

export function validateCoordinatesInput(input: string): ValidationResult {
  if (!input.trim()) {
    return { valid: true }; // Optional field
  }

  const parsed = parseCoordinatesInput(input);
  if (!parsed) {
    return {
      valid: false,
      error: 'Invalid format. Use Google Maps link or "lat, lng"',
    };
  }

  return { valid: true };
}

export function validateDateTime(date: Date): ValidationResult {
  const now = new Date();
  if (date <= now) {
    return { valid: false, error: 'Date must be in the future' };
  }
  return { valid: true };
}

export function validateCapacity(value: string): ValidationResult {
  if (!value.trim()) {
    return { valid: true }; // Optional field
  }

  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1) {
    return { valid: false, error: 'Must be a positive number' };
  }
  if (num > 1000) {
    return { valid: false, error: 'Capacity is too large (max 1000)' };
  }

  return { valid: true };
}

export function validateUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { valid: true }; // Optional field
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
