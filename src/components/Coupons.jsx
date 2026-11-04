import React, { useState, useEffect } from 'react';
import { adminAPI, couponsAPI } from '../services/api';
import { 
  Ticket, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, 
  Clock, Copy, RefreshCw, Sparkles, 
  TrendingUp, Users, IndianRupee, Eye, X, Check, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    expiredCoupons: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [eventsList, setEventsList] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [viewingLogs, setViewingLogs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form state
  const initialFormState = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountAmount: '',
    minPurchaseAmount: '0',
    maxDiscountAmount: '',
    startDate: new Date().toISOString().slice(0, 16),
    expiryDate: '',
    usageLimit: '',
    userUsageLimit: '1',
    applicableTo: 'all',
    applicableEventId: '',
    applicableEventTitle: '',
    isActive: true
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponsAPI.getCoupons({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      });
      if (res && res.success) {
        setCoupons(res.coupons || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (error) {
      console.error('Fetch coupons error:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await adminAPI.getEvents({ limit: 100 });
      if (res && res.events) {
        setEventsList(res.events);
      } else if (Array.isArray(res)) {
        setEventsList(res);
      }
    } catch (e) {
      console.error('Failed to load events for coupon:', e);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountAmount: coupon.discountAmount !== undefined ? String(coupon.discountAmount) : '',
      minPurchaseAmount: coupon.minPurchaseAmount !== undefined ? String(coupon.minPurchaseAmount) : '0',
      maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      userUsageLimit: coupon.userUsageLimit ? String(coupon.userUsageLimit) : '1',
      applicableTo: coupon.applicableTo || 'all',
      applicableEventId: coupon.applicableEventId || '',
      applicableEventTitle: coupon.applicableEventTitle || '',
      isActive: coupon.isActive !== undefined ? coupon.isActive : true
    });
    setIsModalOpen(true);
  };

  const handleGenerateRandomCode = () => {
    const prefixes = ['ART', 'SAVE', 'VIP', 'OFFER', 'CREATE', 'FEST', 'LOVE'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    const randomCode = `${randomPrefix}${randomNum}`;
    setFormData(prev => ({ ...prev, code: randomCode }));
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const res = await couponsAPI.toggleCoupon(coupon._id);
      if (res && res.success) {
        toast.success(res.message);
        setCoupons(prev =>
          prev.map(c => c._id === coupon._id ? { ...c, isActive: res.isActive } : c)
        );
        setStats(prev => ({
          ...prev,
          activeCoupons: res.isActive ? prev.activeCoupons + 1 : Math.max(0, prev.activeCoupons - 1)
        }));
      }
    } catch (error) {
      console.error('Toggle coupon status error:', error);
      toast.error('Failed to update coupon status');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
      return;
    }
    try {
      const res = await couponsAPI.deleteCoupon(coupon._id);
      if (res && res.success) {
        toast.success(`Coupon "${coupon.code}" deleted.`);
        fetchCoupons();
      }
    } catch (error) {
      console.error('Delete coupon error:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      return toast.error('Coupon code is required');
    }
    if (!formData.discountAmount || Number(formData.discountAmount) <= 0) {
      return toast.error('Please enter a valid discount amount greater than 0');
    }
    if (formData.discountType === 'percentage' && Number(formData.discountAmount) > 100) {
      return toast.error('Percentage discount cannot exceed 100%');
    }

    try {
      setSaving(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountAmount: Number(formData.discountAmount),
        minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        userUsageLimit: Number(formData.userUsageLimit) || 1,
        applicableTo: formData.applicableTo,
        applicableEventId: formData.applicableTo === 'events' ? formData.applicableEventId || null : null,
        applicableEventTitle: formData.applicableTo === 'events' ? formData.applicableEventTitle || '' : '',
        isActive: formData.isActive
      };

      if (editingCoupon) {
        await couponsAPI.updateCoupon(editingCoupon._id, payload);
        toast.success(`Coupon "${payload.code}" updated successfully!`);
      } else {
        await couponsAPI.createCoupon(payload);
        toast.success(`Coupon "${payload.code}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error('Save coupon error:', error);
      const msg = error.response?.data?.error || 'Failed to save coupon';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="text-primary-600" />
            Coupon Code Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, manage, and monitor promotional discount coupons for checkout, events, and memberships.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            className="p-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            title="Refresh coupons"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Coupons</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCoupons}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Ticket size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Coupons</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.activeCoupons}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Redemptions</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalRedemptions}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Discounts Given</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">₹{Number(stats.totalDiscountGiven || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            <option value="products">Products / Cart</option>
            <option value="events">Events</option>
            <option value="membership">Membership</option>
            <option value="art-district">ArtDistrict</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-3" />
            <p>Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Coupons Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Create your first promotional discount coupon code for your users.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Plus size={16} />
              Create Coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Conditions</th>
                  <th className="py-3.5 px-4">Applicable To</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon.expiryDate);
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 border border-gray-300 px-2.5 py-1 rounded tracking-wide">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={coupon.description}>
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">
                          {coupon.discountType === 'percentage' ? (
                            <span className="text-indigo-600 flex items-center gap-1 font-bold">
                              {coupon.discountAmount}% OFF
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                              ₹{coupon.discountAmount.toLocaleString()} FLAT OFF
                            </span>
                          )}
                        </div>
                        {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Up to ₹{coupon.maxDiscountAmount.toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Conditions */}
                      <td className="py-3.5 px-4 text-gray-600">
                        {coupon.minPurchaseAmount > 0 ? (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">
                            Min: ₹{coupon.minPurchaseAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No minimum</span>
                        )}
                      </td>

                      {/* Applicable To */}
                      <td className="py-3.5 px-4">
                        {coupon.applicableTo === 'events' ? (
                          coupon.applicableEventTitle ? (
                            <div>
                              <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold inline-block">
                                Event
                              </span>
                              <p className="text-xs text-gray-800 font-medium mt-0.5 max-w-[170px] truncate" title={coupon.applicableEventTitle}>
                                {coupon.applicableEventTitle}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs capitalize px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">
                              All Events
                            </span>
                          )
                        ) : (
                          <span className="text-xs capitalize px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                            {coupon.applicableTo === 'all' ? 'All Platform' : coupon.applicableTo}
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{coupon.timesUsed || 0}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500 text-xs">
                            {coupon.usageLimit ? `${coupon.usageLimit} max` : 'Unlimited'}
                          </span>
                        </div>
                        {coupon.usageLimit && (
                          <div className="w-20 bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-primary-600 h-full rounded-full"
                              style={{
                                width: `${Math.min(100, ((coupon.timesUsed || 0) / coupon.usageLimit) * 100)}%`
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4">
                        {coupon.expiryDate ? (
                          <div>
                            <p className={`text-xs ${expired ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                              Exp: {new Date(coupon.expiryDate).toLocaleDateString()}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {new Date(coupon.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Lifetime / No Expiry</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">
                            <Clock size={12} /> Expired
                          </span>
                        ) : coupon.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Usage history */}
                          <button
                            onClick={() => setViewingLogs(coupon)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View redemption history"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              coupon.isActive 
                                ? 'text-emerald-600 hover:bg-emerald-50' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={coupon.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                          >
                            <CheckCircle2 size={16} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit coupon"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Ticket className="text-primary-600" size={22} />
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCoupon ? `Edit Coupon "${editingCoupon.code}"` : 'Create New Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Code + Generator */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER25"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                    className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    Auto Generate
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description / Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount on summer art exhibition bookings"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Discount Type & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹ Flat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    {formData.discountType === 'percentage' ? 'Percentage Off (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0.01"
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      step="any"
                      placeholder={formData.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                      {formData.discountType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimum Purchase & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0 = No minimum"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={formData.discountType === 'fixed'}
                    placeholder={formData.discountType === 'fixed' ? 'Not applicable' : 'e.g. 1000 (Optional)'}
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Applicable Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Applicable To
                </label>
                <select
                  value={formData.applicableTo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                      ...formData, 
                      applicableTo: val,
                      applicableEventId: val === 'events' ? formData.applicableEventId : '',
                      applicableEventTitle: val === 'events' ? formData.applicableEventTitle : ''
                    });
                  }}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="all">Entire Platform (Products, Events, Memberships)</option>
                  <option value="products">Marketplace Products / Cart Only</option>
                  <option value="events">Events & Workshops Only</option>
                  <option value="membership">Artist Memberships Only</option>
                  <option value="art-district">ArtDistrict Registrations Only</option>
                </select>
              </div>

              {/* Specific Event Selector (shown when Events is selected) */}
              {formData.applicableTo === 'events' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-600" />
                    Which Event? (Select Event)
                  </label>
                  <select
                    value={formData.applicableEventId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const ev = eventsList.find(item => String(item._id) === String(selectedId));
                      setFormData({
                        ...formData,
                        applicableEventId: selectedId,
                        applicableEventTitle: ev ? ev.title : ''
                      });
                    }}
                    className="w-full px-3.5 py-2 border border-purple-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">✨ All Events & Workshops (Valid for any event)</option>
                    {eventsList.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        🎟️ {ev.title} {ev.pricing?.amount ? `(₹${Number(ev.pricing.amount).toLocaleString()})` : '(Free)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-purple-700">
                    {formData.applicableEventId ? (
                      <span>Restricted: Users can <strong>only</strong> apply this coupon when booking <strong>"{formData.applicableEventTitle}"</strong>.</span>
                    ) : (
                      <span>Universal: Coupon will apply to <strong>any</strong> paid event or workshop.</span>
                    )}
                  </p>
                </div>
              )}

              {/* Expiry Date & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Expiry Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Leave empty for lifetime coupon.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Leave empty for unlimited redemptions.</p>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Coupon Status</span>
                  <span className="text-xs text-gray-500">Allow users to apply this coupon immediately.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redemption / Usage History Modal */}
      {viewingLogs && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={20} />
                  Redemption History: <span className="font-mono text-primary-600">{viewingLogs.code}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total times redeemed: <span className="font-semibold text-gray-800">{viewingLogs.timesUsed || 0}</span>
                </p>
              </div>
              <button
                onClick={() => setViewingLogs(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!viewingLogs.usedBy || viewingLogs.usedBy.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p>No users have redeemed this coupon yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewingLogs.usedBy.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{log.email || 'Anonymous Customer'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Order ID: <span className="font-mono">{log.orderId || 'N/A'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">
                          -₹{Number(log.discountApplied || 0).toLocaleString()}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {log.usedAt ? new Date(log.usedAt).toLocaleString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingLogs(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
