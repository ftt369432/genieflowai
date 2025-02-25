import React from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Briefcase, Building2, Stethoscope, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    name: 'Legal Module',
    description: 'Streamline your legal workflow with AI-powered document analysis and case management.',
    icon: Briefcase,
    href: '/modules/legal',
  },
  {
    name: 'Real Estate Module',
    description: 'Automate property analysis, document generation, and client communications.',
    icon: Building2,
    href: '/modules/real-estate',
  },
  {
    name: 'Healthcare Module',
    description: 'Enhance patient care with intelligent scheduling and documentation assistance.',
    icon: Stethoscope,
    href: '/modules/healthcare',
  },
  {
    name: 'Corporate Module',
    description: 'Optimize business operations with AI-driven workflow automation.',
    icon: Users,
    href: '/modules/corporate',
  },
];

export default function HomePage() {
  return (
    <div className="relative isolate">
      {/* Hero section */}
      <div className="relative pt-14">
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                  Your Modular AI Partner for Every Profession
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                  Transform your workflow with industry-specific AI solutions designed to enhance productivity and streamline operations.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/email"
                    className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Try Platform
                  </Link>
                  <Link
                    to="/modules"
                    className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-300"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
              Industry Solutions
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Tailored AI Modules for Your Industry
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Choose from our growing collection of specialized AI modules, each designed to address the unique challenges of your profession.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
              {features.map((feature) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <feature.icon className="h-5 w-5 flex-none text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                    <p className="flex-auto">{feature.description}</p>
                    <p className="mt-6">
                      <Link
                        to={feature.href}
                        className="text-sm font-semibold leading-6 text-blue-600 dark:text-blue-400"
                      >
                        Learn more <span aria-hidden="true">→</span>
                      </Link>
                    </p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}