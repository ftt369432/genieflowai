import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = 'pk_test_51OpXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const stripe = await loadStripe(STRIPE_PUBLIC_KEY);

export async function createSubscription(priceId: string) {
  try {
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    const session = await response.json();
    
    if (session.error) {
      throw new Error(session.error);
    }

    const result = await stripe?.redirectToCheckout({
      sessionId: session.id,
    });

    if (result?.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription() {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}