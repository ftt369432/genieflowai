// Types for subscription plans
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId: string;
  stripePriceIdYearly?: string;
  discountPercentage?: number;
  features: string[];
  mostPopular?: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limited?: boolean;
  info?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'forever';
  discountPercentage?: number;
  features: PlanFeature[];
  mostPopular?: boolean;
  buttonText: string;
}

// Common features shared across all plans
const commonFeatures = [
  'Access to AI assistant',
  'Email management',
  'Calendar integration'
];

// Convert plan features for component use
export const convertToComponentFeatures = (features: string[]): PlanFeature[] => {
  const result: PlanFeature[] = [];
  
  // Common features are always included
  commonFeatures.forEach(feature => {
    result.push({ name: feature, included: true });
  });
  
  // Process additional features
  features.forEach(feature => {
    if (feature.startsWith('!')) {
      // Features starting with ! are not included
      result.push({ 
        name: feature.substring(1), 
        included: false 
      });
    } else if (feature.includes('(limited)')) {
      // Features with (limited) text
      const baseName = feature.replace('(limited)', '').trim();
      result.push({ 
        name: baseName, 
        included: true,
        limited: true,
        info: 'This feature has usage limitations'
      });
    } else {
      // Regular included features
      result.push({ name: feature, included: true });
    }
  });
  
  return result;
};

// Individual plans
export const individualPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic features for personal use',
    price: 0,
    stripePriceId: 'price_free',
    features: [
      'Access to AI assistant',
      'Email management (5 per day)',
      'Basic document analysis',
      '5 AI requests per day',
      '!GenieDrive access'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for professionals',
    price: 10,
    stripePriceId: 'price_pro_monthly',
    stripePriceIdYearly: 'price_pro_yearly',
    discountPercentage: 20,
    mostPopular: true,
    features: [
      'Access to AI assistant',
      'Unlimited email management',
      'Advanced document analysis',
      'Unlimited AI requests',
      'Priority support',
      'Basic analytics',
      'GenieDrive with 10GB storage',
      'AI-powered file analysis'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for power users',
    price: 19,
    stripePriceId: 'price_enterprise_monthly',
    stripePriceIdYearly: 'price_enterprise_yearly',
    discountPercentage: 20,
    features: [
      'Access to AI assistant',
      'Unlimited email management',
      'Advanced document analysis',
      'Unlimited AI requests',
      'Priority support',
      'Advanced analytics',
      'Custom AI model training',
      'Dedicated account manager',
      'GenieDrive with 100GB storage',
      'Advanced file AI analysis',
      'Code repository integration'
    ]
  }
];

// Business plans
export const businessPlans: Plan[] = [
  {
    id: 'free-business',
    name: 'Free Team',
    description: 'Basic features for small teams',
    price: 0,
    stripePriceId: 'price_free_business',
    features: [
      'Access to AI assistant',
      'Email management (5 per day)',
      'Basic document analysis',
      '5 AI requests per day',
      'Up to 3 team members',
      '!GenieDrive access'
    ]
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Advanced features for growing teams',
    price: 25,
    stripePriceId: 'price_business_monthly',
    stripePriceIdYearly: 'price_business_yearly',
    discountPercentage: 20,
    mostPopular: true,
    features: [
      'Access to AI assistant',
      'Unlimited email management',
      'Advanced document analysis',
      'Unlimited AI requests',
      'Priority support',
      'Team collaboration',
      'Basic analytics',
      'Up to 10 team members',
      'GenieDrive with 50GB storage',
      'Shared file workspaces',
      'Team file permissions'
    ]
  },
  {
    id: 'enterprise-business',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    price: 50,
    stripePriceId: 'price_enterprise_business_monthly',
    stripePriceIdYearly: 'price_enterprise_business_yearly',
    discountPercentage: 20,
    features: [
      'Access to AI assistant',
      'Unlimited email management',
      'Advanced document analysis',
      'Unlimited AI requests',
      'Priority support',
      'Team collaboration',
      'Advanced analytics',
      'Custom AI model training',
      'Dedicated account manager',
      'Unlimited team members',
      'Custom integration',
      'GenieDrive with 500GB storage',
      'Enterprise file security',
      'Advanced admin controls',
      'Custom AI models for file analysis'
    ]
  }
];

// Get plan by ID
export const getPlanById = (planId: string): Plan | undefined => {
  return [...individualPlans, ...businessPlans].find(plan => plan.id === planId);
};

// Get plan by Stripe price ID
export const getPlanByPriceId = (priceId: string): Plan | undefined => {
  return [...individualPlans, ...businessPlans].find(
    plan => plan.stripePriceId === priceId || plan.stripePriceIdYearly === priceId
  );
};

// Calculate yearly price
export const getYearlyPrice = (plan: Plan): number => {
  if (plan.price === 0) return 0;
  const monthlyPrice = plan.price;
  const discount = plan.discountPercentage || 0;
  return Math.round((monthlyPrice * 12 * (100 - discount)) / 100);
};

// Convert a Plan to a SubscriptionPlan for the component
export const toSubscriptionPlan = (
  plan: Plan, 
  isYearly: boolean = false
): SubscriptionPlan => {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: isYearly ? getYearlyPrice(plan) / 12 : plan.price,
    billingPeriod: isYearly ? 'yearly' : 'monthly',
    discountPercentage: isYearly ? plan.discountPercentage : undefined,
    features: convertToComponentFeatures(plan.features),
    mostPopular: plan.mostPopular,
    buttonText: plan.price === 0 ? 'Get Started' : 
                plan.id.includes('enterprise') ? 'Contact Sales' : 
                'Subscribe Now'
  };
};