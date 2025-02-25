export interface PlanFeature {
  title: string;
  description: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  maxUsers?: number;
  pricePerExtraUser?: number;
}

export const individualPlans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for freelancers and self-employed professionals',
    monthlyPrice: 15,
    yearlyPrice: 150,
    features: [
      {
        title: 'Task Automation',
        description: 'Automate repetitive tasks and calendar management'
      },
      {
        title: 'Email Assistant',
        description: 'AI-powered email response suggestions'
      },
      {
        title: 'Basic Templates',
        description: 'Access to essential document templates'
      }
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals who need advanced features',
    monthlyPrice: 35,
    yearlyPrice: 350,
    features: [
      {
        title: 'Everything in Basic',
        description: 'All features from the Basic plan'
      },
      {
        title: 'Industry Templates',
        description: 'Specialized templates for your field'
      },
      {
        title: 'Presentation Generator',
        description: 'Create slideshows from text automatically'
      },
      {
        title: 'Training Library',
        description: 'Access to reference materials and guides'
      }
    ]
  }
];

export const businessPlans: Plan[] = [
  {
    id: 'team',
    name: 'Team',
    description: 'Ideal for small to medium-sized teams',
    monthlyPrice: 100,
    yearlyPrice: 1000,
    maxUsers: 10,
    pricePerExtraUser: 10,
    features: [
      {
        title: 'Everything in Pro',
        description: 'All features from the Pro plan'
      },
      {
        title: 'Team Collaboration',
        description: 'Shared tasks and document storage'
      },
      {
        title: 'Custom Training',
        description: 'Customizable training modules'
      },
      {
        title: 'Role Management',
        description: 'Advanced user permissions and roles'
      }
    ]
  },
  {
    id: 'advanced-team',
    name: 'Advanced Team',
    description: 'For larger teams with complex needs',
    monthlyPrice: 200,
    yearlyPrice: 2000,
    maxUsers: 20,
    pricePerExtraUser: 15,
    features: [
      {
        title: 'Everything in Team',
        description: 'All features from the Team plan'
      },
      {
        title: 'Advanced Presentations',
        description: 'Interactive presentation tools'
      },
      {
        title: 'Progress Tracking',
        description: 'Detailed analytics and reporting'
      },
      {
        title: 'Third-party Integration',
        description: 'Connect with your existing tools'
      }
    ]
  }
];

export const enterprisePlan: Plan = {
  id: 'enterprise',
  name: 'Enterprise',
  description: 'Custom solution for large organizations',
  monthlyPrice: 1500,
  yearlyPrice: 15000,
  features: [
    {
      title: 'Custom Platform',
      description: 'Fully customizable platform and branding'
    },
    {
      title: 'Advanced AI',
      description: 'Complex workflow automation'
    },
    {
      title: 'API Access',
      description: 'Build custom integrations'
    },
    {
      title: 'Dedicated Support',
      description: 'Priority support and onboarding'
    },
    {
      title: 'Advanced Analytics',
      description: 'Company-wide productivity tracking'
    }
  ]
};