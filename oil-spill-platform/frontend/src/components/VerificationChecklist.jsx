import React from 'react';

const VerificationChecklist = ({ data }) => {
  const checks = [
    {
      id: 'sar',
      label: 'SAR Radar (Sentinel-1)',
      status: data?.sar || 'pending',
      detail: 'Dark Spot Detected',
      icon: '📡'
    },
    {
      id: 'optical',
      label: 'Optical (Sentinel-2)',
      status: data?.optical || 'pending',
      detail: 'Metallic Sheen Confirmed',
      icon: '🛰️'
    },
    {
      id: 'false_positive',
      label: 'False-Positive Filter',
      status: data?.false_positive || 'pending',
      detail: 'Algal Bloom Signature Absent',
      icon: '🔬'
    },
    {
      id: 'vessel',
      label: 'Dark Vessel Match',
      status: data?.vessel || 'pending',
      detail: 'Source Associated',
      icon: '🚢'
    }
  ];

  const getStatusColor = (status) => {
    if (status === 'confirmed') return 'text-green-400';
    if (status === 'pending') return 'text-yellow-400';
    if (status === 'failed') return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status) => {
    if (status === 'confirmed') return '✅';
    if (status === 'pending') return '⏳';
    if (status === 'failed') return '❌';
    return '⬜';
  };

  const allConfirmed = checks.every(c => c.status === 'confirmed');
  const confidence = allConfirmed ? '98%' : 'Pending';

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        🔍 Sensor Verification Checklist
      </h3>

      <div className="space-y-3">
        {checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{check.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{check.label}</p>
                <p className="text-gray-400 text-xs">{check.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={getStatusColor(check.status)}>
                {getStatusIcon(check.status)}
              </span>
              <span className={	ext-xs font-semibold }>
                {check.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Final Verdict</span>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-xl">{confidence}</span>
            <span className="text-green-400 text-sm">Confirmed Oil Spill</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationChecklist;
