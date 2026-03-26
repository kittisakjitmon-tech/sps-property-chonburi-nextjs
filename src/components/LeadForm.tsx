'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createAppointment } from '@/lib/firestore';

interface LeadFormProps {
  propertyId?: string;
  propertyTitle?: string;
  propertyPrice?: number;
  isRental?: boolean;
  onSuccess?: (message: string) => void;
  onError?: () => void;
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^0\d{9}$/.test(digits);
}

export default function LeadForm({ 
  propertyId = '', 
  propertyTitle = '', 
  propertyPrice, 
  isRental = false, 
  onSuccess, 
  onError 
}: LeadFormProps) {
  const [activeTab, setActiveTab] = useState<'customer' | 'agent'>('customer');
  const [today, setToday] = useState('');
  
  // Customer form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  
  // Agent form fields
  const [agentCustomerName, setAgentCustomerName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentVisitDate, setAgentVisitDate] = useState('');
  const [agentVisitTime, setAgentVisitTime] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set today's date on client only
  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (activeTab === 'customer') {
      if (!customerName.trim()) newErrors.customerName = 'กรุณากรอกชื่อลูกค้า';
      if (!customerPhone.trim()) newErrors.customerPhone = 'กรุณากรอกเบอร์โทร';
      else if (!validatePhone(customerPhone.trim())) newErrors.customerPhone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
      if (!visitDate.trim()) newErrors.visitDate = 'กรุณาเลือกวันที่เข้าชม';
      if (!visitTime.trim()) newErrors.visitTime = 'กรุณาเลือกเวลา';
    } else {
      if (!agentCustomerName.trim()) newErrors.agentCustomerName = 'กรุณากรอกชื่อลูกค้า';
      if (!agentName.trim()) newErrors.agentName = 'กรุณากรอกชื่อเอเจนท์ที่ดูแล';
      if (!agentPhone.trim()) newErrors.agentPhone = 'กรุณากรอกเบอร์โทรเอเจนท์';
      else if (!validatePhone(agentPhone.trim())) newErrors.agentPhone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
      if (!agentVisitDate.trim()) newErrors.agentVisitDate = 'กรุณาเลือกวันที่เข้าชม';
      if (!agentVisitTime.trim()) newErrors.agentVisitTime = 'กรุณาเลือกเวลา';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    setErrors({});

    try {
      const isCustomer = activeTab === 'customer';
      const appointmentData = isCustomer
        ? {
            type: 'Customer' as const,
            contactName: customerName.trim(),
            tel: customerPhone.trim(),
            date: visitDate.trim(),
            time: visitTime.trim(),
            propertyId: propertyId || '',
            propertyTitle: propertyTitle || '',
          }
        : {
            type: 'Agent' as const,
            agentName: agentName.trim(),
            contactName: agentCustomerName.trim(),
            tel: agentPhone.trim(),
            date: agentVisitDate.trim(),
            time: agentVisitTime.trim(),
            propertyId: propertyId || '',
            propertyTitle: propertyTitle || '',
          };

      await createAppointment(appointmentData);

      // Reset form
      if (activeTab === 'customer') {
        setCustomerName('');
        setCustomerPhone('');
        setVisitDate('');
        setVisitTime('');
      } else {
        setAgentCustomerName('');
        setAgentName('');
        setAgentPhone('');
        setAgentVisitDate('');
        setAgentVisitTime('');
      }

      setSubmitted(true);
      onSuccess?.('ส่งคำขอนัดเยี่ยมชมสำเร็จ! เจ้าหน้าที่จะติดต่อกลับเร็วๆ นี้');
      
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('LeadForm error:', err);
      onError?.();
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-colors ${
      hasError ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-200'
    } focus:ring-2 focus:outline-none`;

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
        <p className="text-lg font-bold text-slate-900">ส่งข้อมูลเรียบร้อย!</p>
        <p className="text-sm text-slate-500 mt-2">เจ้าหน้าที่จะติดต่อกลับเร็วๆ นี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('customer')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'customer'
              ? 'bg-blue-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          สำหรับลูกค้า
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agent')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'agent'
              ? 'bg-blue-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          สำหรับเอเจนท์
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="text-base font-bold text-blue-900">
          {activeTab === 'customer' ? 'ลูกค้านัดเข้าชมโครงการ' : 'เอเจนท์พาลูกค้าเข้าชม'}
        </h4>

        {activeTab === 'customer' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อลูกค้า *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: '' })); }}
                placeholder="กรอกชื่อลูกค้า"
                className={fieldClass(!!errors.customerName)}
              />
              {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                เบอร์โทร *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => { setCustomerPhone(e.target.value); setErrors((p) => ({ ...p, customerPhone: '' })); }}
                placeholder="เช่น 0812345678"
                className={fieldClass(!!errors.customerPhone)}
              />
              {errors.customerPhone && <p className="mt-1 text-xs text-red-500">{errors.customerPhone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                วันที่เข้าชม *
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => { setVisitDate(e.target.value); setErrors((p) => ({ ...p, visitDate: '' })); }}
                min={today}
                className={fieldClass(!!errors.visitDate)}
              />
              {errors.visitDate && <p className="mt-1 text-xs text-red-500">{errors.visitDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                เวลา *
              </label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => { setVisitTime(e.target.value); setErrors((p) => ({ ...p, visitTime: '' })); }}
                className={fieldClass(!!errors.visitTime)}
              />
              {errors.visitTime && <p className="mt-1 text-xs text-red-500">{errors.visitTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                รหัสทรัพย์
              </label>
              <input
                type="text"
                value={propertyId}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อลูกค้า *
              </label>
              <input
                type="text"
                value={agentCustomerName}
                onChange={(e) => { setAgentCustomerName(e.target.value); setErrors((p) => ({ ...p, agentCustomerName: '' })); }}
                placeholder="กรอกชื่อลูกค้า"
                className={fieldClass(!!errors.agentCustomerName)}
              />
              {errors.agentCustomerName && <p className="mt-1 text-xs text-red-500">{errors.agentCustomerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อเอเจนท์ที่ดูแล *
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => { setAgentName(e.target.value); setErrors((p) => ({ ...p, agentName: '' })); }}
                placeholder="กรอกชื่อเอเจนท์"
                className={fieldClass(!!errors.agentName)}
              />
              {errors.agentName && <p className="mt-1 text-xs text-red-500">{errors.agentName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                เบอร์โทรเอเจนท์ *
              </label>
              <input
                type="tel"
                value={agentPhone}
                onChange={(e) => { setAgentPhone(e.target.value); setErrors((p) => ({ ...p, agentPhone: '' })); }}
                placeholder="เช่น 0812345678"
                className={fieldClass(!!errors.agentPhone)}
              />
              {errors.agentPhone && <p className="mt-1 text-xs text-red-500">{errors.agentPhone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                วันที่เข้าชม *
              </label>
              <input
                type="date"
                value={agentVisitDate}
                onChange={(e) => { setAgentVisitDate(e.target.value); setErrors((p) => ({ ...p, agentVisitDate: '' })); }}
                min={today}
                className={fieldClass(!!errors.agentVisitDate)}
              />
              {errors.agentVisitDate && <p className="mt-1 text-xs text-red-500">{errors.agentVisitDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                เวลา *
              </label>
              <input
                type="time"
                value={agentVisitTime}
                onChange={(e) => { setAgentVisitTime(e.target.value); setErrors((p) => ({ ...p, agentVisitTime: '' })); }}
                className={fieldClass(!!errors.agentVisitTime)}
              />
              {errors.agentVisitTime && <p className="mt-1 text-xs text-red-500">{errors.agentVisitTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                รหัสทรัพย์
              </label>
              <input
                type="text"
                value={propertyId}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              กำลังส่งข้อมูล…
            </>
          ) : (
            'ส่งคำขอนัดเยี่ยมชม'
          )}
        </button>
      </form>
    </div>
  );
}
