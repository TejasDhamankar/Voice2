import jwt from "jsonwebtoken";
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Create a token
export function createToken(payload: any, duration = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: duration });
}

// Verify a token
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(req: NextRequest) {
  // First try Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then check cookies more carefully
  const tokenCookie = req.cookies.get('token');
  if (tokenCookie && tokenCookie.value) {
    return tokenCookie.value;
  }

  return null;
}

// Get current user from request
export async function getUserFromRequest(req: NextRequest) {
  const token = extractTokenFromRequest(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || typeof decoded !== 'object') return null;

  // Return the decoded user data
  return decoded;
}
