import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Package,
  DollarSign,
  Tag,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Archive
} from 'lucide-react';
import type { Product, BillingType } from '../types';

const demoProducts: Product[] = [
  { id: '1', name: 'CRM Professional', sku: 'CRM-PRO', description: 'Professional CRM license - per user/month', unitPrice: 49, currency: 'USD', billingType: 'recurring', billingFrequency: 'monthly', taxRate: 0, isTaxable: true, isActive: true, isFeatured: true, trackInventory: false, quantityInStock: 0, lowStockThreshold: 0, isLowStock: false, customFields: {}, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'CRM Enterprise', sku: 'CRM-ENT', description: 'Enterprise CRM license - per user/month with advanced features', unitPrice: 99, currency: 'USD', billingType: 'recurring', billingFrequency: 'monthly', taxRate: 0, isTaxable: true, isActive: true, isFeatured: true, trackInventory: false, quantityInStock: 0, lowStockThreshold: 0, isLowStock: false, customFields: {}, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Implementation Service', sku: 'SVC-IMPL', description: 'One-time implementation and setup service', unitPrice: 2500, currency: 'USD', billingType: 'one_time', taxRate: 0, isTaxable: true, isActive: true, isFeatured: false, trackInventory: false, quantityInStock: 0, lowStockThreshold: 0, isLowStock: false, customFields: {}, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Training Package', sku: 'SVC-TRAIN', description: 'Team training package (up to 10 users)', unitPrice: 1500, currency: 'USD', billingType: 'one_time', taxRate: 0, isTaxable: true, isActive: true, isFeatured: false, trackInventory: false, quantityInStock: 0, lowStockThreshold: 0, isLowStock: false, customFields: {}, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'Premium Support', sku: 'SUP-PREM', description: '24/7 premium support - monthly subscription', unitPrice: 299, currency: 'USD', billingType: 'recurring', billingFrequency: 'monthly', taxRate: 0, isTaxable: true, isActive: true, isFeatured: false, trackInventory: false, quantityInStock: 0, lowStockThreshold: 0, isLowStock: false, customFields: {}, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'API Access Add-on', sku: 'ADD-API', description: 'API access for custom integrations', unitPrice: 199, currency: 'USD', billingType: 'recurring', billingFrequency: 'monthly', taxRate: 0, isTaxable: true, isActive: true, isFeatured: false, trackInventory: false, quantityInStock: 0, lowStockThreshold: 0, isLowStock: false, customFields: {}, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

const billingTypeLabels: Record<BillingType, { label: string; color: string }> = {
  one_time: { label: 'One-time', color: 'badge-blue' },
  recurring: { label: 'Recurring', color: 'badge-purple' },
  usage_based: { label: 'Usage-based', color: 'badge-yellow' }
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProducts = products.filter(p => p.isActive).length;
  const recurringProducts = products.filter(p => p.billingType === 'recurring').length;
  const totalMRR = products
    .filter(p => p.isActive && p.billingType === 'recurring')
    .reduce((sum, p) => sum + p.unitPrice, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-1">Products</h1>
          <p className="text-body mt-1">Manage your product catalog</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{activeProducts}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100">
              <Package size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Recurring Products</p>
              <p className="text-2xl font-bold text-violet-600 mt-1">{recurringProducts}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-100">
              <TrendingUp size={20} className="text-violet-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Potential MRR</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">${totalMRR.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon-left"
            />
          </div>
          <button className="btn btn-secondary btn-sm">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="card-interactive p-5 group">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50">
                  <Package size={24} className="text-blue-600" />
                </div>
                <button className="btn btn-ghost btn-icon-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal size={16} />
                </button>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{product.name}</h3>
                  {product.isFeatured && (
                    <span className="badge badge-sm badge-yellow">Featured</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{product.sku}</p>
              </div>
              
              <p className="text-sm text-slate-600 mt-3 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xl font-bold text-slate-900">${product.unitPrice}</p>
                  {product.billingType === 'recurring' && (
                    <p className="text-xs text-slate-500">/{product.billingFrequency}</p>
                  )}
                </div>
                <span className={`badge badge-sm ${billingTypeLabels[product.billingType].color}`}>
                  {billingTypeLabels[product.billingType].label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;

