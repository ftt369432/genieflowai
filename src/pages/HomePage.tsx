import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Calendar, FileText, Brain, ArrowRight, 
  Star, Check, Copy, Search, Users, Shield, Bot, 
  Sparkles, Briefcase, HeartPulse, Building
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

// Industry solutions
const industries = [
  {
    name: 'Legal',
    description: 'Streamline case management, draft legal documents, and analyze precedents with our AI-powered legal assistant.',
    icon: <Copy className="h-6 w-6" />,
    link: '/industries/legal',
  },
  {
    name: 'Real Estate',
    description: 'Automate property listings, generate contracts, and manage client communications efficiently.',
    icon: <Building className="h-6 w-6" />,
    link: '/industries/real-estate',
  },
  {
    name: 'Healthcare',
    description: 'Optimize patient scheduling, automate administrative tasks, and manage medical records securely.',
    icon: <HeartPulse className="h-6 w-6" />,
    link: '/industries/healthcare',
  },
  {
    name: 'Corporate',
    description: 'Boost workplace productivity with intelligent document management, meeting summaries, and workflow automation.',
    icon: <Briefcase className="h-6 w-6" />,
    link: '/industries/corporate',
  },
];

// Core benefits
const coreBenefits = [
  {
    name: 'Smart Email Management',
    description: 'Manage your inbox efficiently with AI-powered categorization, response suggestions, and automated follow-ups.',
    icon: <Mail className="h-6 w-6" />
  },
  {
    name: 'Intelligent Calendar',
    description: 'Schedule meetings, set reminders, and optimize your time with AI-powered scheduling assistant.',
    icon: <Calendar className="h-6 w-6" />
  },
  {
    name: 'Document Analysis',
    description: 'Extract insights, summarize content, and organize your documents with intelligent processing.',
    icon: <FileText className="h-6 w-6" />
  },
  {
    name: 'AI Assistant',
    description: 'Get intelligent suggestions, answers to questions, and help with tasks through natural conversation.',
    icon: <Brain className="h-6 w-6" />
  }
];

// Testimonials
const testimonials = [
  {
    quote: "GenieFlow has completely transformed how I manage my law practice. I save at least 15 hours every week on administrative tasks.",
    author: "Sarah Johnson",
    title: "Attorney at Law",
    avatar: "/images/avatar-female-1.svg"
  },
  {
    quote: "The email management features alone are worth the subscription. The AI accurately categorizes everything and the suggested responses are spot-on.",
    author: "Mark Chen",
    title: "Marketing Director",
    avatar: "/images/avatar-male-1.svg"
  },
  {
    quote: "As a healthcare professional, I need tools that are both efficient and compliant. GenieFlow delivers on both fronts with impressive accuracy.",
    author: "Dr. Priya Patel",
    title: "Family Physician",
    avatar: "/images/avatar-female-2.svg"
  }
];

// Pricing teaser
const pricingTeaser = [
  {
    name: "Free",
    price: "$0",
    description: "Basic features for personal use",
    features: [
      "5 AI requests per day",
      "Basic email management",
      "Calendar integration",
      "Limited document analysis"
    ],
    cta: "Get Started",
    ctaLink: "/signup",
    popular: false
  },
  {
    name: "Pro",
    price: "$10",
    period: "per month",
    description: "Advanced features for professionals",
    features: [
      "Unlimited AI requests",
      "Advanced email management",
      "Smart scheduling assistant",
      "Document analysis & generation",
      "Priority support"
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup?plan=pro",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solutions for organizations",
    features: [
      "Everything in Pro",
      "Custom AI training",
      "Advanced security features",
      "Team collaboration tools",
      "Dedicated account manager"
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
    popular: false
  }
];

export function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Your AI Partner for <span className="text-blue-600 dark:text-blue-400">Effortless Productivity</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-xl">
                  GenieFlow AI streamlines your workflow with intelligent email management, smart scheduling, document analysis, and conversational AI assistance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/login?register=true">
                    <Button size="lg" className="w-full sm:w-auto">
                      Try Free for 7 Days
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    See How It Works
                  </Button>
                </div>
              </motion.div>
            </div>
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                  <img 
                    src="/images/dashboard-preview.svg" 
                    alt="GenieFlow AI Dashboard" 
                    className="w-full"
                    onError={(e) => {
                      e.currentTarget.src = '/images/dashboard-placeholder.svg';
                    }}
                  />
                </div>
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
                  Smart AI
                </div>
                <div className="absolute bottom-4 -left-4 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
                  Time-saving
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Benefits Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Benefits</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover how GenieFlow AI can transform your daily workflow with these powerful features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Solutions Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tailored Industry Solutions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Specialized AI modules designed for your profession's unique requirements
            </p>
      </div>

          <div className="grid md:grid-cols-2 gap-8">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row gap-6 p-6 rounded-xl bg-white dark:bg-gray-900 shadow-md"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {industry.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{industry.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{industry.description}</p>
                  <Link to={industry.link} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their workflow with GenieFlow AI
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full mr-4" 
                  />
                  <div>
                    <h4 className="font-bold">{testimonial.author}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your needs with our straightforward pricing options
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTeaser.map((plan, index) => (
                <motion.div
                key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                className={cn(
                  "flex flex-col p-6 rounded-xl border-2 bg-white dark:bg-gray-900 relative",
                  plan.popular ? "border-blue-500 dark:border-blue-400" : "border-gray-200 dark:border-gray-700"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>}
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to={plan.name === "Free" ? "/login?register=true" : plan.name === "Pro" ? "/login?register=true&plan=pro" : plan.ctaLink} 
                  className={cn(
                    "text-center py-2 px-4 rounded-lg font-medium",
                    plan.popular 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  )}
                >
                  {plan.cta}
                </Link>
                </motion.div>
              ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/pricing" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium">
              View all pricing details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have increased their productivity with GenieFlow AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="default" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10">
              Schedule Demo
            </Button>
        </div>
      </div>
      </section>
    </div>
  );
}