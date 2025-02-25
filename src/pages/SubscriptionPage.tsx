import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PlanCard } from '../components/subscription/PlanCard';
import { createSubscription } from '../services/payment/stripeService';
import { useUserStore } from '../services/auth/userStore';
import {
  individualPlans,
  businessPlans,
  enterprisePlan
} from '../services/payment/plans';

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { subscription } = useUserStore();
  const [isYearly, setIsYearly] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<'individual' | 'business'>('individual');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      await createSubscription(planId);
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose your plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Select the perfect plan for your needs
          </p>
        </div>

        <div className="mt-12 flex justify-center space-x-4">
          <button
            onClick={() => setSelectedType('individual')}
            className={`px-4 py-2 rounded-lg ${
              selectedType === 'individual'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Individual Plans
          </button>
          <button
            onClick={() => setSelectedType('business')}
            className={`px-4 py-2 rounded-lg ${
              selectedType === 'business'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Business Plans
          </button>
        </div>

        <div className="mt-8 flex justify-center items-center space-x-3">
          <button
            onClick={() => setIsYearly(false)}
            className={`text-sm ${!isYearly ? 'font-medium text-blue-600' : 'text-gray-500'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`text-sm ${isYearly ? 'font-medium text-blue-600' : 'text-gray-500'}`}
          >
            Yearly (Save 20%)
          </button>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {selectedType === 'individual' ? (
            individualPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                isCurrentPlan={subscription?.plan === plan.id}
                onSubscribe={handleSubscribe}
                loading={isLoading}
              />
            ))
          ) : (
            businessPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                isCurrentPlan={subscription?.plan === plan.id}
                onSubscribe={handleSubscribe}
                loading={isLoading}
              />
            ))
          )}
        </div>

        <div className="mt-12">
          <div className="border border-gray-200 rounded-lg shadow-sm p-8 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Need a custom solution?
            </h3>
            <p className="text-gray-600 mb-6">
              Our Enterprise plan offers fully customizable solutions for large organizations.
              Get in touch with our sales team to discuss your specific needs.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Custom Platform</p>
                  <p className="text-sm text-gray-500">Fully customizable platform and branding</p>
                </div>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Dedicated Support</p>
                  <p className="text-sm text-gray-500">Priority support and personalized onboarding</p>
                </div>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-1" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Advanced Analytics</p>
                  <p className="text-sm text-gray-500">Company-wide productivity tracking</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/contact-sales')}
              className="mt-8 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 w-full sm:w-auto"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}