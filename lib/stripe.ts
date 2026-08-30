import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * Server-only Stripe client.
 *
 * Payments are optional at the platform level: when STRIPE_SECRET_KEY is not
 * configured, bookings confirm instantly without payment (dev/demo mode).
 * Configure keys to enable real checkout — see .env.example.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
	if (!env.STRIPE_SECRET_KEY) return null;
	if (!client) {
		client = new Stripe(env.STRIPE_SECRET_KEY);
	}
	return client;
}

export function isStripeConfigured(): boolean {
	return Boolean(env.STRIPE_SECRET_KEY);
}
