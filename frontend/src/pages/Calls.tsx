import React, { useState } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  User,
  Mic,
  MicOff,
  Volume2,
  X
} from 'lucide-react';

interface CallLog {
  id: string;
  customerName: string;
  customerPhone: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'voicemail';
  duration: number;
  timestamp: string;
  notes?: string;
}

const mockCallLogs: CallLog[] = [
  {
    id: '1',
    customerName: 'John Smith',
    customerPhone: '+1-555-0101',
    direction: 'outbound',
    status: 'completed',
    duration: 1823,
    timestamp: '2024-01-15T10:30:00Z',
    notes: 'Discussed pricing proposal'
  },
  {
    id: '2',
    customerName: 'Jane Doe',
    customerPhone: '+1-555-0102',
    direction: 'inbound',
    status: 'completed',
    duration: 456,
    timestamp: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    customerName: 'Bob Johnson',
    customerPhone: '+1-555-0201',
    direction: 'inbound',
    status: 'missed',
    duration: 0,
    timestamp: '2024-01-15T08:45:00Z'
  }
];

const Calls: React.FC = () => {
  const [callLogs] = useState<CallLog[]>(mockCallLogs);
  const [showDialer, setShowDialer] = useState(false);
  const [dialNumber, setDialNumber] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDial = (number: string) => {
    console.log('Dialing:', number);
    setIsInCall(true);
    // In real app, this would initiate a call via Twilio
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setShowDialer(false);
    setDialNumber('');
  };

  const dialPadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calls</h1>
          <p className="text-slate-500 mt-1">Make calls and view call history</p>
        </div>
        <button 
          onClick={() => setShowDialer(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Phone size={20} />
          <span>New Call</span>
        </button>
      </div>

      {/* Dialer Modal */}
      {showDialer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            {isInCall ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <PhoneCall className="text-green-600" size={40} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Calling...</h3>
                <p className="text-slate-500 mt-1">{dialNumber || 'Unknown'}</p>
                <p className="text-slate-400 text-sm mt-4">00:00</p>
                
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-4 rounded-full ${isMuted ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <button 
                    onClick={handleEndCall}
                    className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Phone size={24} className="rotate-[135deg]" />
                  </button>
                  <button className="p-4 bg-slate-100 text-slate-600 rounded-full">
                    <Volume2 size={24} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Make a Call</h3>
                  <button 
                    onClick={() => setShowDialer(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <input
                  type="tel"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full text-center text-2xl font-mono py-3 border-b-2 border-slate-200 focus:border-blue-500 outline-none"
                />
                
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {dialPadNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => setDialNumber(prev => prev + num)}
                      className="py-4 text-xl font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handleDial(dialNumber)}
                  disabled={!dialNumber}
                  className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Phone size={20} />
                  Call
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Call Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PhoneCall className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">24</p>
              <p className="text-sm text-slate-500">Total Calls Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <PhoneOutgoing className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">18</p>
              <p className="text-sm text-slate-500">Outbound</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PhoneIncoming className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">6</p>
              <p className="text-sm text-slate-500">Inbound</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">2h 15m</p>
              <p className="text-sm text-slate-500">Total Duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Recent Calls</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {callLogs.map((call) => (
            <div key={call.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  call.status === 'missed' 
                    ? 'bg-red-100' 
                    : call.direction === 'inbound' 
                      ? 'bg-purple-100' 
                      : 'bg-green-100'
                }`}>
                  {call.status === 'missed' ? (
                    <PhoneMissed className="text-red-600" size={20} />
                  ) : call.direction === 'inbound' ? (
                    <PhoneIncoming className="text-purple-600" size={20} />
                  ) : (
                    <PhoneOutgoing className="text-green-600" size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-800">{call.customerName}</h3>
                    <span className="text-sm text-slate-400">{call.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span>{formatTime(call.timestamp)}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                  {call.notes && (
                    <p className="text-sm text-slate-600 mt-1">{call.notes}</p>
                  )}
                </div>
                <button 
                  onClick={() => { setDialNumber(call.customerPhone); setShowDialer(true); }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Phone size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calls;
