'use client';

import { forwardRef, useEffect, useId, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createAppointment } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

interface LeadFormProps {
  propertyId?: string;
  propertyTitle?: string;
  onSuccess?: (message: string) => void;
  onError?: () => void;
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { id, label, error, optional, ...inputProps },
  ref
) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {optional ? <span className="font-normal text-slate-500">(ไม่บังคับ)</span> : '*'}
      </label>
      <input
        {...inputProps}
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-sm bg-white transition-colors focus:ring-2 focus:outline-none ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
        }`}
      />
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
});

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^0\d{9}$/.test(digits);
}

export default function LeadForm({ propertyId = '', propertyTitle = '', onSuccess, onError }: LeadFormProps) {
  const formId = useId();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [activeTab, setActiveTab] = useState<'customer' | 'agent'>('customer');
  const [today, setToday] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [agentCustomerName, setAgentCustomerName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentVisitDate, setAgentVisitDate] = useState('');
  const [agentVisitTime, setAgentVisitTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const now = new Date();
    setToday(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setActiveTab(user ? 'agent' : 'customer');
      setErrors({});
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(() => setSubmitted(false), 5000);
    return () => window.clearTimeout(timer);
  }, [submitted]);

  const fieldId = (name: string) => `${formId}-${name}`;
  const fieldRef = (name: string) => (element: HTMLInputElement | null) => {
    inputRefs.current[name] = element;
  };
  const clearError = (name: string) => setErrors((previous) => ({ ...previous, [name]: '' }));

  const changeTab = (tab: 'customer' | 'agent') => {
    setActiveTab(tab);
    setErrors({});
    setSubmitError('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const newErrors: Record<string, string> = {};

    if (activeTab === 'customer') {
      if (!customerName.trim()) newErrors.customerName = 'กรุณากรอกชื่อลูกค้า';
      if (!customerPhone.trim()) newErrors.customerPhone = 'กรุณากรอกเบอร์โทร';
      else if (!validatePhone(customerPhone)) newErrors.customerPhone = 'กรุณากรอกเบอร์โทร 10 หลักที่ขึ้นต้นด้วย 0';
    } else {
      if (!agentCustomerName.trim()) newErrors.agentCustomerName = 'กรุณากรอกชื่อลูกค้า';
      if (!agentName.trim()) newErrors.agentName = 'กรุณากรอกชื่อเอเจนท์ที่ดูแล';
      if (!agentPhone.trim()) newErrors.agentPhone = 'กรุณากรอกเบอร์โทรเอเจนท์';
      else if (!validatePhone(agentPhone)) newErrors.agentPhone = 'กรุณากรอกเบอร์โทร 10 หลักที่ขึ้นต้นด้วย 0';
    }

    setErrors(newErrors);
    setSubmitError('');
    const firstError = Object.keys(newErrors)[0];
    if (firstError) {
      window.requestAnimationFrame(() => inputRefs.current[firstError]?.focus());
      return;
    }

    setIsLoading(true);
    try {
      const appointmentData = activeTab === 'customer'
        ? {
            type: 'Customer' as const,
            contactName: customerName.trim(),
            tel: customerPhone.trim(),
            date: visitDate,
            time: visitTime,
            propertyId,
            propertyTitle,
          }
        : {
            type: 'Agent' as const,
            agentName: agentName.trim(),
            contactName: agentCustomerName.trim(),
            tel: agentPhone.trim(),
            date: agentVisitDate,
            time: agentVisitTime,
            propertyId,
            propertyTitle,
          };

      await createAppointment(appointmentData);
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
      onSuccess?.('ส่งคำขอนัดชมสำเร็จ เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันวันและเวลา');
    } catch (error) {
      console.error('LeadForm error:', error);
      setSubmitError('ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่ผ่านช่องทางแชท');
      onError?.();
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8" role="status">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" aria-hidden="true" />
        <p className="text-lg font-bold text-slate-900">ส่งข้อมูลเรียบร้อย</p>
        <p className="text-sm text-slate-600 mt-2">เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการนัดชม</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200" role="group" aria-label="ประเภทผู้นัดชม">
        <button
          type="button"
          aria-pressed={activeTab === 'customer'}
          onClick={() => changeTab('customer')}
          className={`flex-1 min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'customer' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          สำหรับลูกค้า
        </button>
        {currentUser && (
          <button
            type="button"
            aria-pressed={activeTab === 'agent'}
            onClick={() => changeTab('agent')}
            className={`flex-1 min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'agent' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            สำหรับเอเจนท์
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={isLoading}>
        <div>
          <h4 className="text-base font-bold text-blue-900">
            {activeTab === 'customer' ? 'นัดเข้าชมทรัพย์' : 'เอเจนท์พาลูกค้าเข้าชม'}
          </h4>
          <p className="text-xs text-slate-600 mt-1">กรอกชื่อและเบอร์โทรเพื่อให้เจ้าหน้าที่ติดต่อกลับ สามารถเลือกวันและเวลาภายหลังได้</p>
        </div>

        {activeTab === 'customer' ? (
          <>
            <InputField ref={fieldRef('customerName')} id={fieldId('customerName')} label="ชื่อลูกค้า" value={customerName} onChange={(event) => { setCustomerName(event.target.value); clearError('customerName'); }} placeholder="ชื่อสำหรับติดต่อ" autoComplete="name" error={errors.customerName} required />
            <InputField ref={fieldRef('customerPhone')} id={fieldId('customerPhone')} label="เบอร์โทร" type="tel" value={customerPhone} onChange={(event) => { setCustomerPhone(event.target.value); clearError('customerPhone'); }} placeholder="เช่น 0812345678" autoComplete="tel" inputMode="tel" error={errors.customerPhone} required />
            <div className="grid grid-cols-2 gap-3">
              <InputField id={fieldId('visitDate')} label="วันที่สะดวก" type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} min={today} optional />
              <InputField id={fieldId('visitTime')} label="เวลาที่สะดวก" type="time" value={visitTime} onChange={(event) => setVisitTime(event.target.value)} optional />
            </div>
          </>
        ) : (
          <>
            <InputField ref={fieldRef('agentCustomerName')} id={fieldId('agentCustomerName')} label="ชื่อลูกค้า" value={agentCustomerName} onChange={(event) => { setAgentCustomerName(event.target.value); clearError('agentCustomerName'); }} placeholder="ชื่อลูกค้า" autoComplete="off" error={errors.agentCustomerName} required />
            <InputField ref={fieldRef('agentName')} id={fieldId('agentName')} label="ชื่อเอเจนท์ที่ดูแล" value={agentName} onChange={(event) => { setAgentName(event.target.value); clearError('agentName'); }} placeholder="ชื่อเอเจนท์" autoComplete="name" error={errors.agentName} required />
            <InputField ref={fieldRef('agentPhone')} id={fieldId('agentPhone')} label="เบอร์โทรเอเจนท์" type="tel" value={agentPhone} onChange={(event) => { setAgentPhone(event.target.value); clearError('agentPhone'); }} placeholder="เช่น 0812345678" autoComplete="tel" inputMode="tel" error={errors.agentPhone} required />
            <div className="grid grid-cols-2 gap-3">
              <InputField id={fieldId('agentVisitDate')} label="วันที่สะดวก" type="date" value={agentVisitDate} onChange={(event) => setAgentVisitDate(event.target.value)} min={today} optional />
              <InputField id={fieldId('agentVisitTime')} label="เวลาที่สะดวก" type="time" value={agentVisitTime} onChange={(event) => setAgentVisitTime(event.target.value)} optional />
            </div>
          </>
        )}

        {submitError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[48px] py-3 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />กำลังส่งข้อมูล…</> : 'ส่งคำขอนัดชม'}
        </button>
      </form>
    </div>
  );
}
