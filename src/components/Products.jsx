import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, ecommerceAPI } from '../services/api';
import { Search, Filter, Plus, Edit, Trash2, Package, Eye, IndianRupee, Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [artists, setArtists] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: 'painting',
    price: '',
    status: 'available',
    artistProfile: '',
    imageUrl: '',
    imageAlt: '',
    paymentLink: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [fetchingSellerPayment, setFetchingSellerPayment] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getProducts({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter
      });
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Products fetch error:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await adminAPI.getArtists({ isActive: true });
        setArtists(res.artists || []);
      } catch (error) {
        console.error('Artists fetch error:', error);
      }
    };
    fetchArtists();
  }, []);

  // fetchProducts is memoized above for stable dependencies.

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminAPI.deleteProduct(productId);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Delete product error:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openEdit = async (product) => {
    setEditingProduct(product);
    const firstImage = product?.images?.[0];
    const firstUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.url || '');
    const firstAlt = typeof firstImage === 'object' ? (firstImage?.alt || '') : '';
    const artistId = product?.artistProfile?._id || product?.artistProfile || '';

    setEditForm({
      name: product?.name || '',
      description: product?.description || '',
      category: product?.category || 'painting',
      price: product?.price ?? '',
      status: product?.status || 'available',
      artistProfile: artistId,
      imageUrl: firstUrl,
      imageAlt: firstAlt,
      paymentLink: product?.paymentLink || '',
    });
    setImageChanged(false);
    setUploadingImage(false);

    if (artistId) {
      try {
        setFetchingSellerPayment(true);
        const sInfo = await ecommerceAPI.getSellerPayment(artistId);
        setSellerInfo(sInfo);
      } catch (err) {
        console.error('Error fetching artist payment:', err);
        setSellerInfo(null);
      } finally {
        setFetchingSellerPayment(false);
      }
    } else {
      setSellerInfo(null);
    }
  };

  const openAdd = () => {
    setEditingProduct({ _isNew: true });
    setEditForm({
      name: '',
      description: '',
      category: 'painting',
      price: '',
      status: 'available',
      artistProfile: '',
      imageUrl: '',
      imageAlt: '',
      paymentLink: '',
    });
    setSellerInfo(null);
    setImageChanged(false);
    setUploadingImage(false);
  };

  const handleArtistChange = async (artistId) => {
    setEditForm((f) => ({ ...f, artistProfile: artistId }));
    if (!artistId) {
      setSellerInfo(null);
      return;
    }
    try {
      setFetchingSellerPayment(true);
      const sInfo = await ecommerceAPI.getSellerPayment(artistId);
      setSellerInfo(sInfo);
      if (sInfo?.paymentLink) {
        setEditForm((f) => ({ ...f, paymentLink: sInfo.paymentLink }));
        toast.success(`Auto-filled E-Commerce payment link for ${sInfo.name || 'artist'}`);
      } else {
        toast('Artist selected. No default E-Commerce payment link configured yet.', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Error fetching artist payment link:', err);
    } finally {
      setFetchingSellerPayment(false);
    }
  };

  const handleSyncArtistPayment = async () => {
    if (!editForm.artistProfile) {
      toast.error('Please select an artist first');
      return;
    }
    try {
      setFetchingSellerPayment(true);
      const sInfo = await ecommerceAPI.getSellerPayment(editForm.artistProfile);
      setSellerInfo(sInfo);
      if (sInfo?.paymentLink) {
        setEditForm((f) => ({ ...f, paymentLink: sInfo.paymentLink }));
        toast.success('Updated payment link from artist E-Commerce setup');
      } else {
        toast.error('This artist does not have an E-Commerce payment link set up');
      }
    } catch (err) {
      toast.error('Failed to fetch artist payment setup');
    } finally {
      setFetchingSellerPayment(false);
    }
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setSaving(false);
    setUploadingImage(false);
    setImageChanged(false);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setSaving(true);

      const payload = {
        name: editForm.name?.trim(),
        description: editForm.description?.trim(),
        category: editForm.category,
        status: editForm.status,
        price: Number(editForm.price),
        artistProfile: editForm.artistProfile || null,
        paymentLink: editForm.paymentLink?.trim() || '',
      };
      if (imageChanged || editingProduct?._isNew) {
        payload.images = editForm.imageUrl?.trim()
          ? [{ url: editForm.imageUrl.trim(), alt: editForm.imageAlt?.trim() || '' }]
          : [];
      }

      if (editingProduct._isNew) {
        // Send inventory formatting expected by backend for new products
        payload.inventory = { quantity: 1, trackQuantity: true };
        const created = await adminAPI.createProduct(payload);
        toast.success('Product created');
        setProducts(prev => [created, ...prev]);
      } else {
        const updated = await adminAPI.updateProduct(editingProduct._id, payload);
        toast.success('Product updated');
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
      closeEdit();
    } catch (error) {
      console.error('Update product error:', error);
      toast.error(error?.response?.data?.error || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage artwork, pricing, and inventory</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="">All Categories</option>
            <option value="painting">Painting</option>
            <option value="digital-art">Digital Art</option>
            <option value="sculpture">Sculpture</option>
            <option value="photography">Photography</option>
            <option value="print">Print</option>
            <option value="supplies">Supplies</option>
            <option value="other">Other</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            {pagination.count} products
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="card overflow-hidden">
            {/* Product Image */}
            <div className="h-48 bg-gray-200 flex items-center justify-center relative">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]?.url || product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={48} className="text-gray-400" />
              )}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                  {product.status}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <IndianRupee size={16} className="text-green-600" />
                  <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {product.category}
                </div>
              </div>

              {/* Artist Info */}
              {(product.artistProfile || product.artist) && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Package size={14} />
                  {product.artistProfile?.name || product.artist?.displayName || 'Unknown Artist'}
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar size={14} />
                Listed {formatDate(product.createdAt)}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 btn-secondary flex items-center justify-center gap-1">
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={() => openEdit(product)}
                  className="flex-1 btn-secondary flex items-center justify-center gap-1"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product._id)}
                  className="btn-danger p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div className="text-sm text-gray-600">
            Showing {((pagination.current - 1) * 10) + 1} to {Math.min(pagination.current * 10, pagination.count)} of {pagination.count} products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(pagination.current - 1)}
              disabled={pagination.current <= 1}
              className="btn-secondary px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.current} of {pagination.total}
            </span>
            <button
              onClick={() => setCurrentPage(pagination.current + 1)}
              disabled={pagination.current >= pagination.total}
              className="btn-secondary px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeEdit}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">
                {editingProduct?._isNew ? 'Add Product' : 'Edit Product'}
              </div>
              <button className="btn-secondary px-3 py-1" onClick={closeEdit} disabled={saving}>
                Close
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input min-h-[96px]"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="input"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="painting">Painting</option>
                  <option value="sculpture">Sculpture</option>
                  <option value="digital-art">Digital Art</option>
                  <option value="photography">Photography</option>
                  <option value="print">Print</option>
                  <option value="supplies">Supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="input"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Artist profile (from Admin Artists)</label>
                  {fetchingSellerPayment && (
                    <span className="text-xs text-blue-600 animate-pulse flex items-center gap-1">
                      <RefreshCw size={11} className="animate-spin" /> Fetching E-Commerce payment link...
                    </span>
                  )}
                </div>
                <select
                  className="input"
                  value={editForm.artistProfile}
                  onChange={(e) => handleArtistChange(e.target.value)}
                >
                  <option value="">None</option>
                  {artists.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} - {a.artForm} {a.isEcommerceSeller ? '★ (Approved Seller)' : ''}
                    </option>
                  ))}
                </select>

                {/* Seller Status Feedback */}
                {editForm.artistProfile && sellerInfo && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {sellerInfo.isEcommerceSeller ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle size={13} className="text-emerald-600" />
                        Approved E-Commerce Seller
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle size={13} className="text-amber-600" />
                        Not enabled as E-Commerce Seller (configure in E-Commerce page)
                      </span>
                    )}
                    {sellerInfo.paymentLink ? (
                      <span className="text-xs text-gray-500 truncate max-w-xs" title={sellerInfo.paymentLink}>
                        Default link: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">{sellerInfo.paymentLink.slice(0, 28)}...</code>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No default payment link configured for this artist.
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Payment Link</label>
                  {editForm.artistProfile && (
                    <button
                      type="button"
                      onClick={handleSyncArtistPayment}
                      className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 hover:underline"
                      title="Sync with artist's E-Commerce payment link"
                    >
                      <RefreshCw size={11} className={fetchingSellerPayment ? 'animate-spin' : ''} />
                      Fetch from Artist
                    </button>
                  )}
                </div>
                <input
                  className="input"
                  type="url"
                  placeholder="https://rzp.io/... or payment link"
                  value={editForm.paymentLink || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, paymentLink: e.target.value }))}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically fetched from the artist's E-Commerce settings.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-700"
                  disabled={saving || uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingImage(true);
                      const res = await adminAPI.uploadProductImage(file);
                      setEditForm((f) => ({ ...f, imageUrl: res.url || '' }));
                      setImageChanged(true);
                      toast.success('Image uploaded');
                    } catch (err) {
                      console.error('Product image upload error:', err);
                      toast.error(err?.response?.data?.error || 'Upload failed');
                    } finally {
                      setUploadingImage(false);
                      e.target.value = '';
                    }
                  }}
                />
                {editForm.imageUrl ? (
                  <div className="mt-3 rounded-lg border overflow-hidden bg-gray-50">
                    <img
                      src={editForm.imageUrl}
                      alt={editForm.imageAlt || editForm.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500">No image.</div>
                )}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image alt text</label>
                  <input
                    className="input"
                    value={editForm.imageAlt}
                    onChange={(e) => setEditForm((f) => ({ ...f, imageAlt: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-end gap-2 flex-shrink-0 bg-white">
              <button className="btn-secondary" onClick={closeEdit} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Products;
