'use client';

import { useState } from 'react';
import { Calculator, Check, MessageCircle } from 'lucide-react';

export default function LoanServicesPage() {
  // Calculator state
  const [totalDebt, setTotalDebt] = useState('');
  const [avgInterestRate, setAvgInterestRate] = useState('18');
  const [homeLoanRate, setHomeLoanRate] = useState('6.5');
  const [showResult, setShowResult] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    lineId: '',
    occupation: '',
    monthlyIncome: '',
    monthlyDebt: '',
    creditHistory: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const debtAmount = parseFloat(totalDebt) || 0;
  const avgRate = parseFloat(avgInterestRate) || 0;
  const homeRate = parseFloat(homeLoanRate) || 0;
  
  const monthlyInterestOnly = (debtAmount * avgRate / 100) / 12;
  const totalInterestCurrent = monthlyInterestOnly * 12 * 20; // 20 years
  const newMonthlyPayment = (debtAmount * (homeRate / 100) / 12);
  const monthlySavings = monthlyInterestOnly - newMonthlyPayment;

  const handleCalculate = () => {
    if (debtAmount > 0) {
      setShowResult(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Submit to API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const checklists = [
    'ไม่ต้องกู้เพิ่ม ใช้บ้านที่มีอยู่เป็นหลักประกัน',
    'รวมหนี้บัตรเครดิต หนี้ส่วนบุคคล เข้าด้วยกัน',
    'ผ่อนถูกลงสูงสุด 50% ต่อเดือน',
    'ปิดหนี้เก่า เริ่มต้นใหม่กับบ้านหลังเดียว',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            เปลี่ยนหนี้บัตรหลายใบ<br />
            ให้เป็นบ้านหลังเดียว<br />
            ผ่อนถูกลงครึ่งต่อครึ่ง!
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl">
            รวมหนี้สินทั้งหมด ไปอยู่ในบ้านที่คุณรัก ผ่อนชำระสะดวก ดอกเบี้ยต่ำกว่าบัตรเครดิต 5-10 เท่า
          </p>
          
          {/* Checklist */}
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {checklists.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm sm:text-base text-white">{item}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button 
            onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-10 inline-flex items-center gap-2 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg shadow-lg transition-colors"
          >
            <Calculator className="w-5 h-5" />
            ประเมินวงเงิน & ทักแชทปรึกษาฟรี
          </button>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-blue-900 mb-2">
              <Calculator className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wider">Tools</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">
              คำนวณเห็นภาพ: รวมหนี้แล้วเหลือเท่าไหร่?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Left Card - Current Debt */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-700 mb-4">ภาระหนี้ปัจจุบัน</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    ยอดหนี้รวม (บาท)
                  </label>
                  <input
                    type="number"
                    value={totalDebt}
                    onChange={(e) => { setTotalDebt(e.target.value); setShowResult(false); }}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    ดอกเบี้ยเฉลี่ย (% ต่อปี)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={avgInterestRate}
                    onChange={(e) => { setAvgInterestRate(e.target.value); setShowResult(false); }}
                    placeholder="18"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                  />
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">ดอกเบี้ยที่ต้องจ่ายต่อปี</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(monthlyInterestOnly * 12).toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท
                  </p>
                </div>
              </div>
            </div>

            {/* Right Card - After Consolidation */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="font-bold text-green-800 mb-4">เมื่อรวมหนี้เป็นก้อนเดียว</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-green-700 mb-2">
                    สินเชื่อบ้านที่คุณมีอยู่ สามารถรีไฟแนนซ์รวมหนี้ได้
                  </p>
                  <label className="block text-sm font-medium text-green-800 mb-2">
                    อัตราดอกเบี้ยบ้านใหม่ (% ต่อปี)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={homeLoanRate}
                    onChange={(e) => { setHomeLoanRate(e.target.value); setShowResult(false); }}
                    placeholder="6.5"
                    className="w-full px-4 py-3 rounded-xl border border-green-300 text-lg focus:outline-none focus:ring-2 focus:ring-green-900/20 focus:border-green-900 bg-white"
                  />
                </div>
                <div className="pt-4 border-t border-green-200">
                  <p className="text-sm text-green-600 mb-1">ค่างวดต่อเดือน (ดอกเบี้ยอย่างเดียว)</p>
                  <p className="text-2xl font-bold text-green-700">
                    {newMonthlyPayment.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="text-center mb-6">
            <button
              onClick={handleCalculate}
              disabled={!totalDebt || debtAmount <= 0}
              className="px-10 py-4 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
            >
              คำนวณผลต่าง
            </button>
          </div>

          {/* Result Box */}
          {showResult && debtAmount > 0 && (
            <div className="bg-teal-700 text-white rounded-2xl p-8 text-center">
              <p className="text-teal-200 mb-2">ผ่อนชำระต่อเดือนลดลง</p>
              <p className="text-4xl sm:text-5xl font-bold mb-2">
                {Math.abs(monthlySavings).toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท
              </p>
              <p className="text-teal-200 text-sm">
                {monthlySavings > 0 ? '👍 คุณจะประหยัดได้เดือนละ' : '⚠️ ตรวจสอบยอดหนี้และอัตราดอกเบี้ยอีกครั้ง'} 
                {' '}{Math.abs(monthlySavings).toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท
              </p>
              {monthlySavings > 0 && (
                <p className="text-teal-300 text-xs mt-4">
                  รวมประหยัดได้ถึง {(Math.abs(monthlySavings) * 12 * 5).toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท ใน 5 ปีแรก
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Lead Form Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-blue-900 mb-2">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wider">Contact</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
              เช็คโอกาสกู้ & รับคำปรึกษาส่วนตัว
            </h2>
            <p className="text-slate-500 text-sm">
              ข้อมูลของคุณจะถูกเก็บเป็นความลับ 100%
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ส่งข้อมูลเรียบร้อย!</h3>
              <p className="text-slate-600">
                เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมง
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-สกุล</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อ-สกุล"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0XXXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Line ID</label>
                <input
                  type="text"
                  value={formData.lineId}
                  onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                  placeholder="@yourlineid"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">อาชีพ</label>
                <select
                  required
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                >
                  <option value="">เลือกอาชีพ</option>
                  <option value="salary">พนักงานบริษัท</option>
                  <option value="government">ข้าราชการ/รัฐวิสาหกิจ</option>
                  <option value="business">ธุรกิจส่วนตัว</option>
                  <option value="freelance">ฟรีแลนซ์</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รายได้รวม/เดือน</label>
                  <input
                    type="number"
                    required
                    value={formData.monthlyIncome}
                    onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ภาระหนี้/เดือน</label>
                  <input
                    type="number"
                    required
                    value={formData.monthlyDebt}
                    onChange={(e) => setFormData({ ...formData, monthlyDebt: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ประวัติเครดิต</label>
                <select
                  required
                  value={formData.creditHistory}
                  onChange={(e) => setFormData({ ...formData, creditHistory: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                >
                  <option value="">เลือกประวัติเครดิต</option>
                  <option value="excellent">ดีมาก (ไม่เคยค้างชำระ)</option>
                  <option value="good">ดี (มีหนี้แต่ชำระสม่ำเสมอ)</option>
                  <option value="fair">พอใช้ (เคยค้างชำระ 1-2 ครั้ง)</option>
                  <option value="poor">ไม่ดี (หนี้เสียหรือติดแบล็คลิสต์)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังส่งข้อมูล...
                  </>
                ) : (
                  'ส่งข้อมูลรับคำปรึกษา'
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 bg-blue-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-2xl font-bold mb-4">พร้อมเริ่มต้นทางเศรษฐกิจที่ดีกว่าแล้วหรือยัง?</h3>
          <p className="text-blue-200 mb-6">
            ทักแชทมาคุยกับเราฟรี! ไม่มีค่าใช้จ่าย ไม่มีข้อผูกพัน
          </p>
          <button 
            onClick={() => window.open('https://line.me/ti/p/~spsproperty', '_blank')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            ทักแชท Line ตอนนี้
          </button>
        </div>
      </section>
    </div>
  );
}
