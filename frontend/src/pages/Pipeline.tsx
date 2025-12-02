import React, { useState, useEffect } from 'react';
import {
  Plus,
  MoreHorizontal,
  Clock,
  User,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  Filter,
  SortAsc,
  ChevronDown,
  Search,
  Grip
} from 'lucide-react';
import type { Pipeline, PipelineStage, Deal } from '../types';

// Demo data
const demoPipeline: Pipeline = {
  id: '1',
  name: 'Sales Pipeline',
  description: 'Main sales pipeline',
  isDefault: true,
  isActive: true,
  currency: 'USD',
  winProbabilityEnabled: true,
  stages: [
    { id: '1', pipelineId: '1', name: 'Qualification', position: 1, winProbability: 10, color: '#6366f1', isWonStage: false, isLostStage: false, rottingDays: 14, dealsCount: 5, totalValue: 125000 },
    { id: '2', pipelineId: '1', name: 'Needs Analysis', position: 2, winProbability: 25, color: '#8b5cf6', isWonStage: false, isLostStage: false, rottingDays: 21, dealsCount: 4, totalValue: 180000 },
    { id: '3', pipelineId: '1', name: 'Proposal', position: 3, winProbability: 50, color: '#a855f7', isWonStage: false, isLostStage: false, rottingDays: 14, dealsCount: 6, totalValue: 320000 },
    { id: '4', pipelineId: '1', name: 'Negotiation', position: 4, winProbability: 75, color: '#d946ef', isWonStage: false, isLostStage: false, rottingDays: 7, dealsCount: 3, totalValue: 215000 },
    { id: '5', pipelineId: '1', name: 'Closed Won', position: 5, winProbability: 100, color: '#22c55e', isWonStage: true, isLostStage: false, rottingDays: 0, dealsCount: 8, totalValue: 485000 },
  ],
  dealsCount: 26,
  totalValue: 1325000,
  createdAt: new Date().toISOString()
};

const demoDeals: Deal[] = [
  { id: '1', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '1', stageName: 'Qualification', stageColor: '#6366f1', name: 'Enterprise License', description: 'Annual enterprise license deal', dealNumber: 'DEMO-D001', amount: 45000, currency: 'USD', weightedValue: 4500, probability: 10, expectedCloseDate: '2024-02-15', status: 'open', contactId: '1', contactName: 'John Smith', accountId: '1', accountName: 'Acme Corporation', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 3, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['enterprise'], customFields: {}, activitiesCount: 5, notesCount: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '1', stageName: 'Qualification', stageColor: '#6366f1', name: 'Consulting Package', description: 'Monthly consulting retainer', dealNumber: 'DEMO-D002', amount: 28000, currency: 'USD', weightedValue: 2800, probability: 10, expectedCloseDate: '2024-02-20', status: 'open', contactId: '2', contactName: 'Sarah Chen', accountId: '2', accountName: 'TechStart Inc', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 5, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['consulting'], customFields: {}, activitiesCount: 3, notesCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '2', stageName: 'Needs Analysis', stageColor: '#8b5cf6', name: 'Platform Upgrade', description: 'Platform upgrade for existing customer', dealNumber: 'DEMO-D003', amount: 65000, currency: 'USD', weightedValue: 16250, probability: 25, expectedCloseDate: '2024-03-01', status: 'open', contactId: '3', contactName: 'Mike Johnson', accountId: '3', accountName: 'DataFlow Systems', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 8, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['upsell'], customFields: {}, activitiesCount: 7, notesCount: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '2', stageName: 'Needs Analysis', stageColor: '#8b5cf6', name: 'Multi-year Contract', description: '3-year commitment deal', dealNumber: 'DEMO-D004', amount: 120000, currency: 'USD', weightedValue: 30000, probability: 25, expectedCloseDate: '2024-03-15', status: 'open', contactId: '4', contactName: 'Lisa Park', accountId: '4', accountName: 'Global Industries', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 12, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['enterprise', 'multi-year'], customFields: {}, activitiesCount: 10, notesCount: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '3', stageName: 'Proposal', stageColor: '#a855f7', name: 'Annual Subscription', description: 'Annual subscription renewal', dealNumber: 'DEMO-D005', amount: 85000, currency: 'USD', weightedValue: 42500, probability: 50, expectedCloseDate: '2024-02-28', status: 'open', contactId: '5', contactName: 'David Kim', accountId: '5', accountName: 'InnovateTech', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 4, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['renewal'], customFields: {}, activitiesCount: 8, notesCount: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '3', stageName: 'Proposal', stageColor: '#a855f7', name: 'Support Package', description: 'Premium support package', dealNumber: 'DEMO-D006', amount: 35000, currency: 'USD', weightedValue: 17500, probability: 50, expectedCloseDate: '2024-02-25', status: 'open', contactId: '6', contactName: 'Emma Wilson', accountId: '6', accountName: 'CloudFirst', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 6, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['support'], customFields: {}, activitiesCount: 4, notesCount: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '4', stageName: 'Negotiation', stageColor: '#d946ef', name: 'Enterprise Suite', description: 'Full enterprise suite deployment', dealNumber: 'DEMO-D007', amount: 125000, currency: 'USD', weightedValue: 93750, probability: 75, expectedCloseDate: '2024-02-10', status: 'open', contactId: '7', contactName: 'James Brown', accountId: '7', accountName: 'MegaCorp', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 5, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['enterprise', 'high-value'], customFields: {}, activitiesCount: 15, notesCount: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '4', stageName: 'Negotiation', stageColor: '#d946ef', name: 'Implementation Services', description: 'Custom implementation project', dealNumber: 'DEMO-D008', amount: 55000, currency: 'USD', weightedValue: 41250, probability: 75, expectedCloseDate: '2024-02-12', status: 'open', contactId: '8', contactName: 'Rachel Green', accountId: '8', accountName: 'StartupHub', ownerId: '1', ownerName: 'Alex Johnson', daysInStage: 3, isRotting: false, stageEnteredAt: new Date().toISOString(), tags: ['services'], customFields: {}, activitiesCount: 6, notesCount: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Deal Card Component
interface DealCardProps {
  deal: Deal;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
  onClick: () => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onDragStart, onClick }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={onClick}
      className="deal-card"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-800 line-clamp-2">{deal.name}</h4>
        <button className="p-1 rounded hover:bg-gray-100 text-slate-400 flex-shrink-0">
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      <p className="deal-card-value mt-2">
        ${deal.amount.toLocaleString()}
      </p>
      
      {deal.accountName && (
        <div className="flex items-center gap-1.5 mt-2">
          <Building2 size={12} className="text-slate-400" />
          <span className="deal-card-company">{deal.accountName}</span>
        </div>
      )}
      
      <div className="deal-card-footer">
        <div className="flex items-center gap-3">
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar size={12} />
              <span>{new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          {deal.isRotting && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle size={12} />
              <span>Stalled</span>
            </div>
          )}
        </div>
        
        <div className="avatar avatar-xs" title={deal.ownerName}>
          <span>{deal.ownerName?.charAt(0) || 'U'}</span>
        </div>
      </div>
    </div>
  );
};

// Pipeline Column Component
interface PipelineColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
  onDealClick: (deal: Deal) => void;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ 
  stage, deals, onDragOver, onDrop, onDragStart, onDealClick 
}) => {
  const stageDeals = deals.filter(d => d.stageId === stage.id);
  const stageValue = stageDeals.reduce((sum, d) => sum + d.amount, 0);
  
  return (
    <div 
      className="pipeline-column"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <div className="pipeline-header">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: stage.color }}
          />
          <span className="pipeline-header-title">{stage.name}</span>
          <span className="pipeline-header-count">{stageDeals.length}</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-700">
            ${(stageValue / 1000).toFixed(0)}k
          </p>
          <p className="text-[10px] text-slate-400">{stage.winProbability}% prob</p>
        </div>
      </div>
      
      <div className="pipeline-body">
        {stageDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Grip size={24} className="mb-2 opacity-50" />
            <p className="text-xs">Drop deals here</p>
          </div>
        ) : (
          stageDeals.map(deal => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              onDragStart={onDragStart}
              onClick={() => onDealClick(deal)}
            />
          ))
        )}
      </div>
      
      <div className="p-3 pt-0">
        <button className="w-full py-2 px-3 rounded-lg border-2 border-dashed border-gray-200 text-slate-500 text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
          <Plus size={16} />
          Add Deal
        </button>
      </div>
    </div>
  );
};

const Pipeline: React.FC = () => {
  const [pipeline, setPipeline] = useState<Pipeline>(demoPipeline);
  const [deals, setDeals] = useState<Deal[]>(demoDeals);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stageId !== stageId) {
      const stage = pipeline.stages.find(s => s.id === stageId);
      if (stage) {
        setDeals(prev => prev.map(d => 
          d.id === draggedDeal.id 
            ? { 
                ...d, 
                stageId, 
                stageName: stage.name, 
                stageColor: stage.color,
                probability: stage.winProbability,
                daysInStage: 0,
                stageEnteredAt: new Date().toISOString()
              } 
            : d
        ));
      }
    }
    setDraggedDeal(null);
  };

  const filteredDeals = deals.filter(deal => 
    deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.accountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPipelineValue = filteredDeals
    .filter(d => d.status === 'open')
    .reduce((sum, d) => sum + d.amount, 0);
  
  const weightedValue = filteredDeals
    .filter(d => d.status === 'open')
    .reduce((sum, d) => sum + d.weightedValue, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-heading-1">Sales Pipeline</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <DollarSign size={16} className="text-slate-400" />
              <span>Total: <strong className="text-slate-800">${(totalPipelineValue / 1000).toFixed(0)}k</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={16} className="text-slate-400" />
              <span>Weighted: <strong className="text-emerald-600">${(weightedValue / 1000).toFixed(0)}k</strong></span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm pl-9 w-64"
            />
          </div>
          <button className="btn btn-secondary btn-sm">
            <Filter size={16} />
            Filter
          </button>
          <button className="btn btn-secondary btn-sm">
            <SortAsc size={16} />
            Sort
          </button>
          <button className="btn btn-primary btn-sm">
            <Plus size={16} />
            Add Deal
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-hidden">
        <div className="pipeline-board h-full">
          {pipeline.stages
            .filter(s => !s.isLostStage)
            .map(stage => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={filteredDeals}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onDealClick={setSelectedDeal}
              />
            ))}
        </div>
      </div>

      {/* Deal Detail Slide-over (simplified) */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setSelectedDeal(null)}
          />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-slide-in overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{selectedDeal.dealNumber}</p>
                <h2 className="text-lg font-bold text-slate-800">{selectedDeal.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedDeal(null)}
                className="btn btn-ghost btn-icon-sm"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Value */}
              <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-1">Deal Value</p>
                <p className="text-3xl font-bold text-slate-900">${selectedDeal.amount.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span 
                    className="badge badge-sm" 
                    style={{ backgroundColor: `${selectedDeal.stageColor}20`, color: selectedDeal.stageColor }}
                  >
                    {selectedDeal.stageName}
                  </span>
                  <span className="text-sm text-slate-500">{selectedDeal.probability}% probability</span>
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Building2 size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account</p>
                    <p className="text-sm font-medium text-slate-800">{selectedDeal.accountName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <User size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Contact</p>
                    <p className="text-sm font-medium text-slate-800">{selectedDeal.contactName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Calendar size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expected Close</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedDeal.expectedCloseDate 
                        ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString('en-US', { 
                            month: 'long', day: 'numeric', year: 'numeric' 
                          })
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Clock size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Days in Stage</p>
                    <p className="text-sm font-medium text-slate-800">{selectedDeal.daysInStage} days</p>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button className="btn btn-primary flex-1">Edit Deal</button>
                <button className="btn btn-secondary flex-1">Add Activity</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;

