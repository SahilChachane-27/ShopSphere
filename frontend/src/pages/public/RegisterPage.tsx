import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, UserCheck, Store, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerCustomer, registerSeller } = useAuth();

  const [roleTab, setRoleTab] = useState<'CUSTOMER' | 'SELLER'>(
    searchParams.get('role') === 'seller' ? 'SELLER' : 'CUSTOMER'
  );

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    store_name: '',
    store_description: '',
    business_email: '',
    business_phone: '',
    tax_id: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (roleTab === 'CUSTOMER') {
        await registerCustomer({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number,
        });
        alert('Customer account registered successfully! Please log in.');
        navigate('/login');
      } else {
        await registerSeller({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number,
          store_name: formData.store_name,
          store_description: formData.store_description,
          business_email: formData.business_email || formData.email,
          business_phone: formData.business_phone || formData.phone_number,
          tax_id: formData.tax_id,
        });
        alert('Seller application submitted! Pending Admin approval before login.');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-2xl font-black text-white">Create ShopSphere Account</h2>
          <p className="text-xs text-slate-400">Join as a buyer or expand your store as a verified seller</p>
        </div>

        {/* Role Tab selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRoleTab('CUSTOMER')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              roleTab === 'CUSTOMER'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck size={16} /> Customer Account
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('SELLER')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              roleTab === 'SELLER'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store size={16} /> Seller Store Account
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                required
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+919876543210"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white"
            />
          </div>

          {/* Seller Extra Fields */}
          {roleTab === 'SELLER' && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Store & Business Details
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Name</label>
                <input
                  type="text"
                  name="store_name"
                  required
                  value={formData.store_name}
                  onChange={handleChange}
                  placeholder="e.g. Apex Tech Store"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tax ID / GSTIN</label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  placeholder="GSTIN99887766"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Description</label>
                <textarea
                  name="store_description"
                  rows={2}
                  value={formData.store_description}
                  onChange={handleChange}
                  placeholder="Describe the items you sell..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
              roleTab === 'CUSTOMER'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
            }`}
          >
            {isLoading ? 'Creating Account...' : `Register ${roleTab === 'CUSTOMER' ? 'Customer' : 'Seller'} Account`}{' '}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
