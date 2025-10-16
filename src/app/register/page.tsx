import TenantRegisterForm from '@/components/auth/TenantRegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <TenantRegisterForm />
    </div>
  );
}