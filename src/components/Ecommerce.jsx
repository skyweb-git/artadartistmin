import React, { useState, useEffect, useCallback } from 'react';
import { ecommerceAPI } from '../services/api';
import { 
  ShoppingBag, Store, Users, IndianRupee, Search, 
  ExternalLink, Edit2, Trash2, 
  Plus, RefreshCw, Copy, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Ecommerce = () => {
  // Main Tab: 'sellers' | 'payments'
  const [activeTab, setActiveTab] = useState('sellers');

  // Sellers State
  const [sellers, setSellers] = useState([]);
  const [sellersStats, setSellersStats] = useState({ totalArtists: 0, totalSellers: 0, nonSellers: 0 });
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState('all'); // all | sellers | nonsellers
  const [paymentFilter, setPaymentFilter] = useState('all'); // all | hasLink | noLink

  // Payments State
  const [payments, setPayments] = useState([]);
  const [paymentsStats, setPaymentsStats] = useState({ totalOrders: 0, totalAmount: 0, totalPaid: 0, totalPayout: 0, totalCommission: 0 });
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Modals
  const [editingSeller, setEditingSeller] = useState(null); // artist object
  const [sellerForm, setSellerForm] = useState({
    isEcommerceSeller: false,
    paymentLink: '',
    upiId: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    commissionRate: 10,
    payoutMethod: 'bank_transfer',
    notes: '',
    syncProducts: true
  });
  const [savingSeller, setSavingSeller] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    artist: '',
    artistName: '',
    productName: '',
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    amount: '',
    paymentMethod: 'payment_link',
    paymentLinkUsed: '',
    status: 'paid',
    notes: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const [copiedLink, setCopiedLink] = useState(null);

  // Fetch Sellers
  const fetchSellers = useCallback(async () => {
    try {
      setLoadingSellers(true);
      const isSellerQuery = sellerFilter === 'sellers' ? 'true' : sellerFilter === 'nonsellers' ? 'false' : undefined;
      const res = await ecommerceAPI.getSellers({
        search: sellerSearch || undefined,
        isSeller: isSellerQuery
      });
      if (res && res.success) {
        setSellers(res.artists || []);
        if (res.stats) {
          setSellersStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching e-commerce sellers:', err);
      toast.error('Failed to load artist sellers');
    } finally {
      setLoadingSellers(false);
    }
  }, [sellerSearch, sellerFilter]);

  // Fetch Payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const res = await ecommerceAPI.getPayments({
        search: paymentSearch || undefined,
        status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined
      });
      if (res && res.success) {
        setPayments(res.payments || []);
        if (res.stats) {
          setPaymentsStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching e-commerce payments:', err);
      toast.error('Failed to load e-commerce payments');
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentSearch, paymentStatusFilter]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, fetchPayments]);

  // Toggle seller status directly
  const handleToggleSellerStatus = async (artist) => {
    const newStatus = !artist.isEcommerceSeller;
    try {
      await ecommerceAPI.updateSeller(artist._id, {
        isEcommerceSeller: newStatus
      });
      toast.success(
        newStatus 
          ? `${artist.name} is now approved to sell on E-Commerce!` 
          : `${artist.name} E-Commerce selling privileges disabled.`
      );
      fetchSellers();
    } catch (err) {
      console.error('Error toggling seller status:', err);
      toast.error('Failed to update seller status');
    }
  };

  // Open seller edit modal
  const openEditSeller = (artist) => {
    setEditingSeller(artist);
    const p = artist.ecommercePayment || {};
    setSellerForm({
      isEcommerceSeller: Boolean(artist.isEcommerceSeller),
      paymentLink: p.paymentLink || '',
      upiId: p.upiId || '',
      accountHolder: p.accountHolder || '',
      accountNumber: p.accountNumber || '',
      ifscCode: p.ifscCode || '',
      bankName: p.bankName || '',
      commissionRate: p.commissionRate ?? 10,
      payoutMethod: p.payoutMethod || 'bank_transfer',
      notes: p.notes || '',
      syncProducts: true
    });
  };

  // Save seller settings
  const handleSaveSeller = async (e) => {
    e.preventDefault();
    if (!editingSeller) return;
    try {
      setSavingSeller(true);
      const res = await ecommerceAPI.updateSeller(editingSeller._id, {
        isEcommerceSeller: sellerForm.isEcommerceSeller,
        payment: {
          paymentLink: sellerForm.paymentLink.trim(),
          upiId: sellerForm.upiId.trim(),
          accountHolder: sellerForm.accountHolder.trim(),
          accountNumber: sellerForm.accountNumber.trim(),
          ifscCode: sellerForm.ifscCode.trim(),
          bankName: sellerForm.bankName.trim(),
          commissionRate: Number(sellerForm.commissionRate) || 0,
          payoutMethod: sellerForm.payoutMethod,
          notes: sellerForm.notes.trim()
        },
        syncProducts: sellerForm.syncProducts
      });

      if (res && res.success) {
        toast.success(
          sellerForm.syncProducts && res.productsUpdated > 0
            ? `Settings saved & synced to ${res.productsUpdated} products!`
            : 'Seller & payment settings updated!'
        );
        setEditingSeller(null);
        fetchSellers();
      }
    } catch (err) {
      console.error('Error saving seller settings:', err);
      toast.error(err?.response?.data?.error || 'Failed to save seller settings');
    } finally {
      setSavingSeller(false);
    }
  };

  // Copy payment link helper
  const handleCopyLink = (link, id) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    toast.success('Payment link copied to clipboard!');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Update payment status
  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await ecommerceAPI.updatePayment(paymentId, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchPayments();
    } catch (err) {
      console.error('Error updating payment status:', err);
      toast.error('Failed to update status');
    }
  };

  // Delete payment record
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this e-commerce payment record?')) return;
    try {
      await ecommerceAPI.deletePayment(paymentId);
      toast.success('E-Commerce payment record deleted');
      fetchPayments();
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error('Failed to delete payment');
    }
  };

  // Create manual payment record
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!newPaymentForm.amount || Number(newPaymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      setSavingPayment(true);
      await ecommerceAPI.createPayment({
        ...newPaymentForm,
        amount: Number(newPaymentForm.amount)
      });
      toast.success('E-Commerce order / payment recorded successfully!');
      setPaymentModalOpen(false);
      setNewPaymentForm({
        artist: '',
        artistName: '',
        productName: '',
        buyerName: '',
        buyerEmail: '',
        buyerPhone: '',
        amount: '',
        paymentMethod: 'payment_link',
        paymentLinkUsed: '',
        status: 'paid',
        notes: ''
      });
      fetchPayments();
    } catch (err) {
      console.error('Error creating payment:', err);
      toast.error(err?.response?.data?.error || 'Failed to record payment');
    } finally {
      setSavingPayment(false);
    }
  };

  // Filter sellers by payment link presence
  const filteredSellers = sellers.filter(artist => {
    if (paymentFilter === 'hasLink') {
      return Boolean(artist.ecommercePayment?.paymentLink);
    }
    if (paymentFilter === 'noLink') {
      return !artist.ecommercePayment?.paymentLink;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">E-Commerce Management</h1>
            <span className="bg-red-100 text-red-700 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Exclusive
            </span>
          </div>
          <p className="text-gray-600 mt-1 text-sm">
            Control which artists are approved to sell, set individual payment links, and track dedicated e-commerce transactions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-200/80 p-1 rounded-xl self-start sm:self-auto border border-gray-300/50">
          <button
            onClick={() => setActiveTab('sellers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'sellers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Store size={16} className={activeTab === 'sellers' ? 'text-red-600' : ''} />
            <span>Approved Sellers & Payment Setup</span>
            <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full border border-red-200 font-bold">
              {sellersStats.totalSellers}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'payments'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <IndianRupee size={16} className={activeTab === 'payments' ? 'text-emerald-600' : ''} />
            <span>E-Commerce Payments</span>
            <span className="bg-emerald-50 text-emerald-600 text-xs px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              {paymentsStats.totalOrders}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-red-600 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Sellers</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{sellersStats.totalSellers}</div>
            <div className="text-xs text-gray-500 mt-1">out of {sellersStats.totalArtists} total artists</div>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <Store size={24} />
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-blue-600 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Non-Selling Artists</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{sellersStats.nonSellers}</div>
            <div className="text-xs text-gray-500 mt-1">Exhibition / Gallery only</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-600 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-Commerce Orders</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{paymentsStats.totalOrders}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">{paymentsStats.totalPaid} paid orders</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-600 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sales Volume</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">₹{paymentsStats.totalAmount?.toLocaleString('en-IN') || 0}</div>
            <div className="text-xs text-purple-600 font-medium mt-1">₹{paymentsStats.totalCommission?.toLocaleString('en-IN') || 0} platform commission</div>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {/* ─── TAB 1: SELLERS & PAYMENT SETUP ────────────────────────────────────────── */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search artist name, art form, email..."
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  className="input pl-9 text-sm"
                />
              </div>

              <div>
                <select
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                  className="input text-sm"
                >
                  <option value="all">All Artists ({sellersStats.totalArtists})</option>
                  <option value="sellers">Approved E-Commerce Sellers Only ({sellersStats.totalSellers})</option>
                  <option value="nonsellers">Non-Sellers ({sellersStats.nonSellers})</option>
                </select>
              </div>

              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="input text-sm"
                >
                  <option value="all">Payment Link: All</option>
                  <option value="hasLink">With Payment Link Configured</option>
                  <option value="noLink">No Payment Link Yet</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={fetchSellers}
                  className="btn-secondary text-sm flex items-center gap-1.5"
                  title="Refresh artist sellers"
                >
                  <RefreshCw size={15} className={loadingSellers ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sellers Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Artist Selling Privileges & Payment Links</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Only toggled artists can sell artworks online. Configure their payment link below to auto-fill when editing artworks.
                </p>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Showing {filteredSellers.length} artist{filteredSellers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingSellers ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
                <div className="text-sm text-gray-500">Loading artists...</div>
              </div>
            ) : filteredSellers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Store size={40} className="mx-auto text-gray-300 mb-2" />
                <div className="font-semibold text-gray-700">No artists match your criteria</div>
                <div className="text-xs text-gray-400 mt-1">Try clearing your search query or filters.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-100/75 text-xs font-bold uppercase tracking-wider text-gray-600">
                      <th className="py-3 px-4">Artist</th>
                      <th className="py-3 px-4 text-center">Can Sell (E-Commerce)</th>
                      <th className="py-3 px-4">E-Commerce Payment Link</th>
                      <th className="py-3 px-4">UPI / Payout</th>
                      <th className="py-3 px-4 text-center">Artworks</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSellers.map((artist) => {
                      const isSeller = Boolean(artist.isEcommerceSeller);
                      const payment = artist.ecommercePayment || {};
                      const hasLink = Boolean(payment.paymentLink);

                      return (
                        <tr key={artist._id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Artist Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {artist.profileImage?.url || artist.image ? (
                                <img
                                  src={artist.profileImage?.url || artist.image}
                                  alt={artist.name}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center text-sm border border-red-200">
                                  {artist.name?.charAt(0) || 'A'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span>{artist.name}</span>
                                  {artist.artistId && (
                                    <span className="text-xs text-gray-400 font-mono">#{artist.artistId}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {artist.artForm || 'Artist'} {artist.email ? `• ${artist.email}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Toggle Status */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSellerStatus(artist)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isSeller ? 'bg-emerald-600' : 'bg-gray-300'
                                }`}
                                title={isSeller ? 'Click to disable selling' : 'Click to approve as seller'}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isSeller ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <span className={`text-[11px] font-semibold mt-1 ${
                                isSeller ? 'text-emerald-700' : 'text-gray-400'
                              }`}>
                                {isSeller ? 'Approved Seller' : 'Not Selling'}
                              </span>
                            </div>
                          </td>

                          {/* Payment Link */}
                          <td className="py-3.5 px-4">
                            {hasLink ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={payment.paymentLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-mono text-blue-600 hover:underline max-w-[200px] truncate inline-flex items-center gap-1"
                                  title={payment.paymentLink}
                                >
                                  {payment.paymentLink}
                                  <ExternalLink size={12} className="flex-shrink-0" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(payment.paymentLink, artist._id)}
                                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                  title="Copy link"
                                >
                                  {copiedLink === artist._id ? (
                                    <Check size={14} className="text-green-600" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <AlertCircle size={12} /> Not configured
                              </span>
                            )}
                          </td>

                          {/* UPI / Payout */}
                          <td className="py-3.5 px-4">
                            {payment.upiId ? (
                              <div className="text-xs font-medium text-gray-900">
                                <span className="font-bold text-gray-500">UPI:</span> {payment.upiId}
                              </div>
                            ) : payment.accountNumber ? (
                              <div className="text-xs text-gray-700">
                                <div><span className="font-bold text-gray-500">A/C:</span> ••••{payment.accountNumber.slice(-4)}</div>
                                <div className="text-[11px] text-gray-400">{payment.bankName || 'Bank Transfer'}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>

                          {/* Artworks */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {artist.artworksCount || 0} ({artist.availableArtworksCount || 0} avail)
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openEditSeller(artist)}
                              className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                            >
                              <Edit2 size={13} />
                              <span>Configure Payment</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: E-COMMERCE PAYMENTS ────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search buyer, artwork, artist, order ID..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="input pl-9 text-sm"
                />
              </div>

              <div>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="input text-sm"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="completed">Completed / Delivered</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={fetchPayments}
                  className="btn-secondary text-sm flex items-center gap-1.5"
                  title="Refresh payments"
                >
                  <RefreshCw size={15} className={loadingPayments ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  <span>Record E-Commerce Payment</span>
                </button>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">E-Commerce Artwork Transactions</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dedicated transaction ledger strictly for online artworks sold through artist payment links.
                </p>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {payments.length} transaction{payments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingPayments ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
                <div className="text-sm text-gray-500">Loading e-commerce transactions...</div>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ShoppingBag size={40} className="mx-auto text-gray-300 mb-2" />
                <div className="font-semibold text-gray-700">No E-Commerce payments recorded yet</div>
                <div className="text-xs text-gray-400 mt-1">
                  When users purchase artworks via artist payment links or when you manually log a transaction, it will appear here.
                </div>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="btn-primary text-xs mt-4 inline-flex items-center gap-1"
                >
                  <Plus size={14} /> Record First E-Commerce Payment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-100/75 text-xs font-bold uppercase tracking-wider text-gray-600">
                      <th className="py-3 px-4">Order / Artwork</th>
                      <th className="py-3 px-4">Artist</th>
                      <th className="py-3 px-4">Buyer Details</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method & Link</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((p) => {
                      const getStatusBadge = (st) => {
                        switch (st) {
                          case 'paid':
                            return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          case 'completed':
                            return 'bg-blue-100 text-blue-800 border-blue-300';
                          case 'pending':
                            return 'bg-amber-100 text-amber-800 border-amber-300';
                          case 'cancelled':
                            return 'bg-red-100 text-red-800 border-red-300';
                          case 'refunded':
                            return 'bg-purple-100 text-purple-800 border-purple-300';
                          default:
                            return 'bg-gray-100 text-gray-800 border-gray-300';
                        }
                      };

                      return (
                        <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Order / Artwork */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{p.productName || 'Artwork'}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              #{p.orderId} • {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>

                          {/* Artist */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-800">{p.artistName || p.artist?.name || 'Artist'}</div>
                          </td>

                          {/* Buyer */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-gray-900">{p.buyerName || 'Buyer'}</div>
                            <div className="text-xs text-gray-500">{p.buyerEmail || p.buyerPhone || '—'}</div>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-gray-900 flex items-center gap-0.5">
                              <IndianRupee size={14} className="text-green-600" />
                              <span>{p.amount?.toLocaleString('en-IN')}</span>
                            </div>
                            {p.commissionAmount > 0 && (
                              <div className="text-[11px] text-gray-500">
                                Fee: ₹{p.commissionAmount} | Net: ₹{p.artistPayoutAmount}
                              </div>
                            )}
                          </td>

                          {/* Method & Link */}
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-semibold capitalize text-gray-700">
                              {p.paymentMethod?.replace('_', ' ') || 'Payment Link'}
                            </div>
                            {p.paymentLinkUsed && (
                              <a
                                href={p.paymentLinkUsed}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                              >
                                View link <ArrowUpRight size={10} />
                              </a>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <select
                              value={p.status}
                              onChange={(e) => handleUpdatePaymentStatus(p._id, e.target.value)}
                              className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer capitalize ${getStatusBadge(p.status)}`}
                            >
                              <option value="paid">Paid</option>
                              <option value="completed">Completed</option>
                              <option value="pending">Pending</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeletePayment(p._id)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors"
                              title="Delete record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIGURE SELLER & PAYMENT SETTINGS ─────────────────────────── */}
      {editingSeller && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setEditingSeller(null)} />
            
            <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8">
              {/* Modal Header */}
              <div className="p-6 border-b bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {editingSeller.profileImage?.url || editingSeller.image ? (
                    <img
                      src={editingSeller.profileImage?.url || editingSeller.image}
                      alt={editingSeller.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/80"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 text-white font-black flex items-center justify-center text-lg border-2 border-white/80">
                      {editingSeller.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{editingSeller.name}</h3>
                    <p className="text-red-100 text-xs mt-0.5">
                      {editingSeller.artForm || 'Artist'} {editingSeller.artistId ? `• #${editingSeller.artistId}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingSeller(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveSeller} className="p-6 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {/* Selling Privilege Switch */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">Allow Artist to Sell in E-Commerce</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      When enabled, buyer purchase buttons will appear on this artist's available artworks.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSellerForm(f => ({ ...f, isEcommerceSeller: !f.isEcommerceSeller }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      sellerForm.isEcommerceSeller ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        sellerForm.isEcommerceSeller ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Payment Link Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    E-Commerce Payment Link (Razorpay / Cashfree / Custom)
                  </label>
                  <input
                    type="url"
                    placeholder="https://rzp.io/l/... or payment link URL"
                    value={sellerForm.paymentLink}
                    onChange={(e) => setSellerForm(f => ({ ...f, paymentLink: e.target.value }))}
                    className="input text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This link will automatically prefill when an admin adds or edits any product for this artist.
                  </p>
                </div>

                {/* UPI ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Artist UPI ID (For Direct Payments / QR)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. artistname@upi or artist@okhdfcbank"
                    value={sellerForm.upiId}
                    onChange={(e) => setSellerForm(f => ({ ...f, upiId: e.target.value }))}
                    className="input text-sm"
                  />
                </div>

                {/* Bank Account Details */}
                <div className="border-t pt-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Bank Account Details (For Artist Payouts)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="Name as per bank account"
                        value={sellerForm.accountHolder}
                        onChange={(e) => setSellerForm(f => ({ ...f, accountHolder: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank, SBI"
                        value={sellerForm.bankName}
                        onChange={(e) => setSellerForm(f => ({ ...f, bankName: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="Account number"
                        value={sellerForm.accountNumber}
                        onChange={(e) => setSellerForm(f => ({ ...f, accountNumber: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={sellerForm.ifscCode}
                        onChange={(e) => setSellerForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                        className="input text-sm uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Commission & Payout Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Platform Commission Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={sellerForm.commissionRate}
                      onChange={(e) => setSellerForm(f => ({ ...f, commissionRate: e.target.value }))}
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Payout Method</label>
                    <select
                      value={sellerForm.payoutMethod}
                      onChange={(e) => setSellerForm(f => ({ ...f, payoutMethod: e.target.value }))}
                      className="input text-sm"
                    >
                      <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="upi">UPI Transfer</option>
                      <option value="cashfree_direct">Cashfree Direct Payout</option>
                      <option value="manual">Manual Settlement</option>
                    </select>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    placeholder="KYC verified, special commission deal, contact preferences..."
                    value={sellerForm.notes}
                    onChange={(e) => setSellerForm(f => ({ ...f, notes: e.target.value }))}
                    className="input text-sm"
                  />
                </div>

                {/* Sync Existing Products Checkbox */}
                <div className="p-3 bg-red-50/70 rounded-lg border border-red-200">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sellerForm.syncProducts}
                      onChange={(e) => setSellerForm(f => ({ ...f, syncProducts: e.target.checked }))}
                      className="mt-0.5 rounded text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-900">
                        Sync payment link to all existing products of this artist
                      </span>
                      <p className="text-gray-600 mt-0.5">
                        Updates all current artwork products for {editingSeller.name} with this payment link automatically.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingSeller(null)}
                    className="btn-secondary text-sm px-4 py-2"
                    disabled={savingSeller}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-sm px-6 py-2 flex items-center gap-2"
                    disabled={savingSeller}
                  >
                    {savingSeller ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save & Apply Settings</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: RECORD E-COMMERCE PAYMENT ────────────────────────────────────── */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setPaymentModalOpen(false)} />
            
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
              <div className="p-6 border-b bg-gray-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Record E-Commerce Payment</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Log an artwork sale under E-Commerce transactions</p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Artist Profile</label>
                  <select
                    value={newPaymentForm.artist}
                    onChange={(e) => {
                      const selected = sellers.find(a => a._id === e.target.value);
                      setNewPaymentForm(f => ({
                        ...f,
                        artist: e.target.value,
                        artistName: selected?.name || '',
                        paymentLinkUsed: selected?.ecommercePayment?.paymentLink || f.paymentLinkUsed
                      }));
                    }}
                    className="input text-sm"
                    required
                  >
                    <option value="">Select Artist</option>
                    {sellers.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} - {a.artForm} {a.isEcommerceSeller ? '(Approved Seller)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Artwork / Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Lord Venkateswara Sketch"
                    value={newPaymentForm.productName}
                    onChange={(e) => setNewPaymentForm(f => ({ ...f, productName: e.target.value }))}
                    className="input text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Buyer Name</label>
                    <input
                      type="text"
                      placeholder="Buyer full name"
                      value={newPaymentForm.buyerName}
                      onChange={(e) => setNewPaymentForm(f => ({ ...f, buyerName: e.target.value }))}
                      className="input text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5000"
                      value={newPaymentForm.amount}
                      onChange={(e) => setNewPaymentForm(f => ({ ...f, amount: e.target.value }))}
                      className="input text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Buyer Email</label>
                    <input
                      type="email"
                      placeholder="buyer@example.com"
                      value={newPaymentForm.buyerEmail}
                      onChange={(e) => setNewPaymentForm(f => ({ ...f, buyerEmail: e.target.value }))}
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Buyer Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={newPaymentForm.buyerPhone}
                      onChange={(e) => setNewPaymentForm(f => ({ ...f, buyerPhone: e.target.value }))}
                      className="input text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={newPaymentForm.paymentMethod}
                      onChange={(e) => setNewPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
                      className="input text-sm"
                    >
                      <option value="payment_link">Payment Link</option>
                      <option value="upi">Direct UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Debit / Credit Card</option>
                      <option value="other">Other / Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Status</label>
                    <select
                      value={newPaymentForm.status}
                      onChange={(e) => setNewPaymentForm(f => ({ ...f, status: e.target.value }))}
                      className="input text-sm"
                    >
                      <option value="paid">Paid</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Link Used</label>
                  <input
                    type="url"
                    placeholder="https://rzp.io/..."
                    value={newPaymentForm.paymentLinkUsed}
                    onChange={(e) => setNewPaymentForm(f => ({ ...f, paymentLinkUsed: e.target.value }))}
                    className="input text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="btn-secondary text-sm px-4 py-2"
                    disabled={savingPayment}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-sm px-6 py-2"
                    disabled={savingPayment}
                  >
                    {savingPayment ? 'Saving...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ecommerce;
