'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { ArrowRight, Check, Building2, Users, MessageSquare, BarChart3 } from 'lucide-react';

export default function Home() {
  const { user, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (isHydrated && !isLoading && !hasChecked) {
      console.log('🏠 Home page routing decision:', { user: !!user, isLoading, isHydrated });
      setHasChecked(true);
      if (user) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, isHydrated, router, hasChecked]);

  // Show landing page if not logged in
  if (!user && isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Building2 className="text-blue-600" size={32} />
                <span className="text-2xl font-bold text-gray-900">Insurance CRM</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/login')}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Manage Your Insurance <br />
              <span className="text-blue-600">Leads Like a Pro</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              All-in-one CRM platform with WhatsApp integration, AI-powered responses,
              and automated workflows. Perfect for insurance agencies.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/register')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg flex items-center"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2" size={20} />
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✓ 1 Month Free Trial • ✓ No Credit Card Required • ✓ Cancel Anytime
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <MessageSquare className="text-blue-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3">WhatsApp Integration</h3>
              <p className="text-gray-600">
                Connect directly with leads via WhatsApp. Automated responses and real-time conversations.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <Users className="text-blue-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3">Multi-User Support</h3>
              <p className="text-gray-600">
                Manage your entire team with role-based access control and performance tracking.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <BarChart3 className="text-blue-600 mb-4" size={40} />
              <h3 className="text-xl font-semibold mb-3">Analytics & Reports</h3>
              <p className="text-gray-600">
                Track conversions, pipeline metrics, and team performance with beautiful dashboards.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl mb-8 text-blue-100">
              Pay per user, per month. Scale as you grow.
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">Basic</h3>
                <p className="text-3xl font-bold mb-4">₦5,000 <span className="text-sm font-normal">/user/mo</span></p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><Check size={18} className="mr-2" /> Up to 5 users</li>
                  <li className="flex items-center"><Check size={18} className="mr-2" /> 1,000 leads</li>
                  <li className="flex items-center"><Check size={18} className="mr-2" /> WhatsApp Integration</li>
                </ul>
              </div>
              <div className="bg-white/20 backdrop-blur p-6 rounded-xl border-2 border-white">
                <div className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
                  POPULAR
                </div>
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">₦8,000 <span className="text-sm font-normal">/user/mo</span></p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><Check size={18} className="mr-2" /> Up to 20 users</li>
                  <li className="flex items-center"><Check size={18} className="mr-2" /> 10,000 leads</li>
                  <li className="flex items-center"><Check size={18} className="mr-2" /> AI Features</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <p className="text-3xl font-bold mb-4">₦15,000 <span className="text-sm font-normal">/user/mo</span></p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><Check size={18} className="mr-2" /> Unlimited users</li>
                  <li className="flex items-center"><Check size={18} className="mr-2" /> Unlimited leads</li>
                  <li className="flex items-center"><Check size={18} className="mr-2" /> Priority support</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => router.push('/register')}
              className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-semibold text-lg"
            >
              Get Started Free
            </button>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Sales?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of insurance agencies already using our platform
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg inline-flex items-center"
          >
            Start Your 1-Month Free Trial
            <ArrowRight className="ml-2" size={20} />
          </button>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              © 2025 Insurance CRM. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
