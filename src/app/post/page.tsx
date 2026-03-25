'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, Check, AlertCircle, Upload, X,
  Target, Zap, Shield, MapPin, MessageCircle
} from 'lucide-react';

const CATEGORIES = [
  { value: 'SPS-S-1CLASS-ID', label: 'บ้านเดี่ยว 1 ชั้น' },
  { value: 'SPS-S-2CLASS-ID', label: 'บ้านเดี่ยว 2 ชั้น' },
  { value: 'SPS-TW-1CLASS-ID', label: 'บ้านแฝด 1 ชั้น' },
  { value: 'SPS-TW-2CLASS-ID', label: 'บ้านแฝด 2 ชั้น' },
  { value: 'SPS-TH-1CLASS-ID', label: 'ทาวน์โฮม 1 ชั้น' },
  { value: 'SPS-TH-2CLASS-ID', label: 'ทาวน์โฮม 2 ชั้น' },
  { value: 'SPS-PV-ID', label: 'บ้านพูลวิลล่า' },
  { value: 'SPS-CD-ID', label: 'คอนโด' },
  { value: 'SPS-LD-ID', label: 'ที่ดินเปล่า' },
  { value: 'SPS-RP-ID', label: 'บ้านเช่า/ผ่อนตรง' },
];

const SUGGESTED_TAGS = [
  'บ้านเดี่ยว',
  'คอนโด',
  'ใกล้นิคมอมตะซิตี้',
  'ผ่อนตรง',
  'พร้อมอยู่',
  'พานทอง',
  'ชลบุรี',
  'ศรีราชา',
  'ระยอง',
];

const PROVINCES = [
  'ชลบุรี', 'ระยอง', 'ฉะเชิงเทรา', 'พระประแกศ', 'สระแก้ว', 
  'จันทบุรี', 'ตราด', 'นครนายก', 'ปราจีนบุรี'
];

const DISTRICTS: Record<string, string[]> = {
  'ชลบุรี': ['เมืองชลบุรี', 'บ้านบึง', 'พานทอง', 'ศรีราชา', 'สัตหีบ', 'บางละมุง', 'พลูตาหลวง', 'หนองใหญ่', 'โป่งงาม', 'นาเฉลิมวงศ์', 'บางแสน', 'แหลมแอง', 'เหมือง', 'คลองพาย', 'ท่าบอน', 'หนองตาคง', 'หนองอิรุณ', 'ชะอำ', 'บางนางทวี', 'สำนักบก', 'ทุ่งตะเครชะ', 'ท่าช้าง', 'วังกระแจะ', 'ห้วยใหญ่', 'ประจวบคีรีขลัง'],
  'ระยอง': ['เมืองระยอง', 'บ้านฉาง', 'นิคมพัฒนา', 'วิชัยพัฒนา', 'แกลง', 'บ้านดาล', 'กระทุ่มยาว', 'ปากน้ำแหลมสิงห์', 'สองสลึง', 'ทางขยาย', 'ประจวนคีรีขันธ์', 'ห้วยทองหทัย', 'ทุ่งรัก', 'พงงา'],
  'ฉะเชิงเทรา': ['เมืองฉะเชิงเทรา', 'บางคล้า', 'บางน้ำเชี่ยว', 'บางปะกง', 'บางเล้า', 'คลองเขื่อน', 'วังตะเคียน', 'ท่ากระดาน', 'สนามจันทร์', 'ดอนสะแก', 'เขาพระพุทธราช', 'พนมสารคาม', 'หนองเดิ่น', 'ราชสาส์น', 'สิงโต', 'มะขามคู่', 'แหลมสมบูรณ์'],
};

interface FormData {
  title: string;
  type: string;
  price: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  province: string;
  district: string;
  description: string;
  images: string[];
  tags: string[];
  contactName: string;
  contactPhone: string;
  contactLineId: string;
  directInstallment: boolean;
  hotDeal: boolean;
  acceptedTerms: boolean;
}

interface PreviewFile {
  file: File;
  preview: string;
}

export default function PostPropertyPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    title: '',
    type: 'SPS-CD-ID',
    price: '',
    area: '',
    bedrooms: 2,
    bathrooms: 1,
    province: 'ชลบุรี',
    district: '',
    description: '',
    images: [],
    tags: [],
    contactName: '',
    contactPhone: '',
    contactLineId: '',
    directInstallment: false,
    hotDeal: false,
    acceptedTerms: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const updateForm = (partial: Partial<FormData>) => setForm((prev) => ({ ...prev, ...partial }));

  const filteredTags = SUGGESTED_TAGS.filter(
    (tag) => tag.toLowerCase().includes(tagInput.toLowerCase()) && !form.tags.includes(tag)
  );

  const addTag = (tag: string) => {
    if (!form.tags.includes(tag) && form.tags.length < 10) {
      updateForm({ tags: [...form.tags, tag] });
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateForm({ tags: form.tags.filter((tag) => tag !== tagToRemove) });
  };

  // Image handling
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (previewFiles.length + files.length > 10) {
      setError('อัปโหลดได้สูงสุด 10 รูป');
      return;
    }

    setUploadingImages(true);
    try {
      const newPreviews = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPreviewFiles((prev) => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Error:', err);
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewFiles[index].preview);
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      if (!form.title.trim()) {
        setError('กรุณากรอกชื่อประกาศ');
        return false;
      }
      if (!form.price || Number(form.price) <= 0) {
        setError('กรุณากรอกราคาที่ถูกต้อง');
        return false;
      }
      if (!form.district) {
        setError('กรุณาเลือกอำเภอ');
        return false;
      }
    }
    if (stepNum === 3) {
      if (!form.contactName.trim()) {
        setError('กรุณากรอกชื่อผู้ติดต่อ');
        return false;
      }
      if (!form.contactPhone.trim()) {
        setError('กรุณากรอกเบอร์โทรศัพท์');
        return false;
      }
      if (!form.acceptedTerms) {
        setError('กรุณายอมรับเงื่อนไขก่อนส่งประกาศ');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setSubmitting(true);
    setError(null);

    try {
      // TODO: Upload to Firebase/Cloudinary and save to Firestore
      // For now, simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting:', err);
      setError('เกิดข้อผิดพลาดในการส่งประกาศ');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">ส่งประกาศสำเร็จ!</h2>
            <p className="text-slate-600 mb-6">
              ระบบได้รับข้อมูลแล้ว เจ้าหน้าที่จะตรวจสอบและอนุมัติภายใน 24 ชม.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const benefits = [
    {
      icon: Target,
      title: 'เข้าถึงคนอมตะซิตี้โดยตรง',
      desc: 'เจาะกลุ่มเป้าหมายในนิคมอุตสาหกรรม ชลบุรี และระยอง',
    },
    {
      icon: Zap,
      title: 'โอกาสขายไวด้วยระบบผ่อนตรง',
      desc: 'รองรับกลุ่มลูกค้าที่สนใจการเช่าซื้อ/ผ่อนตรง',
    },
    {
      icon: Shield,
      title: 'ลงง่าย ไม่มีค่าธรรมเนียม',
      desc: 'ระบบจัดการง่าย พร้อมทีมงานช่วยตรวจสอบข้อมูล',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center py-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">ลงประกาศฟรี</h1>
          <p className="text-xl text-white/80">ไม่มีค่าใช้จ่ายแอบแฝง สะดวก รวดเร็ว</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Form Column (7/10) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Progress Stepper */}
                <div className="bg-gradient-to-r from-blue-50 via-blue-50/80 to-blue-50 px-6 sm:px-8 py-6 border-b border-blue-200">
                  <div className="flex flex-col items-center justify-center">
                    {/* Steps Circles */}
                    <div className="flex items-center justify-between w-full mb-4">
                      {[1, 2, 3].map((s) => {
                        const isActive = step === s;
                        const isCompleted = step > s;
                        return (
                          <div key={s} className="flex-1 flex items-center">
                            <div className="relative flex flex-col items-center flex-1">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 relative z-10 ${
                                  isActive
                                    ? 'bg-blue-900 text-white shadow-lg ring-4 ring-blue-900/20'
                                    : isCompleted
                                    ? 'bg-blue-900 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {isCompleted ? <Check className="h-6 w-6" /> : <span className="text-base">{s}</span>}
                              </div>
                            </div>
                            {s < 3 && (
                              <div
                                className={`flex-1 h-1 mx-3 rounded-full transition-all duration-300 ${
                                  isCompleted ? 'bg-blue-900' : 'bg-gray-200'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Step Labels */}
                    <div className="flex justify-between w-full text-sm">
                      <span className={`text-center transition-all ${step >= 1 ? (step === 1 ? 'font-bold text-blue-900' : 'font-semibold text-blue-900') : 'font-normal text-gray-400'}`}>
                        ข้อมูลทรัพย์สิน
                      </span>
                      <span className={`text-center transition-all ${step >= 2 ? (step === 2 ? 'font-bold text-blue-900' : 'font-semibold text-blue-900') : 'font-normal text-gray-400'}`}>
                        รูปภาพ
                      </span>
                      <span className={`text-center transition-all ${step >= 3 ? (step === 3 ? 'font-bold text-blue-900' : 'font-semibold text-blue-900') : 'font-normal text-gray-400'}`}>
                        ข้อมูลติดต่อ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-6 sm:p-8">
                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-800 flex-1">{error}</p>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="p-1 hover:bg-red-100 rounded transition"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  )}

                  {/* Step 1: Property Info */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="post-title" className="block text-sm font-medium text-slate-700 mb-2">
                          ชื่อประกาศ <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="post-title"
                          type="text"
                          value={form.title}
                          onChange={(e) => updateForm({ title: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          placeholder="เช่น คอนโดหรู ใกล้ BTS อารีย์"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="post-type" className="block text-sm font-medium text-slate-700 mb-2">
                            ประเภท <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="post-type"
                            value={form.type}
                            onChange={(e) => updateForm({ type: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="post-price" className="block text-sm font-medium text-slate-700 mb-2">
                            ราคา (บาท) <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="post-price"
                            type="number"
                            value={form.price}
                            onChange={(e) => updateForm({ price: e.target.value })}
                            min="0"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                            placeholder="เช่น 5000000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="post-area" className="block text-sm font-medium text-slate-700 mb-2">
                            พื้นที่ (ตร.ว.)
                          </label>
                          <input
                            id="post-area"
                            type="number"
                            value={form.area}
                            onChange={(e) => updateForm({ area: e.target.value })}
                            min="0"
                            step="0.5"
                            placeholder="เช่น 25"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          />
                        </div>

                        <div>
                          <label htmlFor="post-bedrooms" className="block text-sm font-medium text-slate-700 mb-2">
                            ห้องนอน
                          </label>
                          <input
                            id="post-bedrooms"
                            type="number"
                            value={form.bedrooms}
                            onChange={(e) => updateForm({ bedrooms: Number(e.target.value) })}
                            min="0"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          />
                        </div>

                        <div>
                          <label htmlFor="post-bathrooms" className="block text-sm font-medium text-slate-700 mb-2">
                            ห้องน้ำ
                          </label>
                          <input
                            id="post-bathrooms"
                            type="number"
                            value={form.bathrooms}
                            onChange={(e) => updateForm({ bathrooms: Number(e.target.value) })}
                            min="0"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="post-province" className="block text-sm font-medium text-slate-700 mb-2">
                            จังหวัด
                          </label>
                          <select
                            id="post-province"
                            value={form.province}
                            onChange={(e) => updateForm({ province: e.target.value, district: '' })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          >
                            {PROVINCES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="post-district" className="block text-sm font-medium text-slate-700 mb-2">
                            อำเภอ/เขต <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="post-district"
                            value={form.district}
                            onChange={(e) => updateForm({ district: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          >
                            <option value="">เลือกอำเภอ</option>
                            {(DISTRICTS[form.province] || []).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="post-description" className="block text-sm font-medium text-slate-700 mb-2">
                          รายละเอียด
                        </label>
                        <textarea
                          id="post-description"
                          value={form.description}
                          onChange={(e) => updateForm({ description: e.target.value })}
                          rows={5}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 resize-none"
                          placeholder="อธิบายรายละเอียดทรัพย์สิน..."
                        />
                      </div>

                      <div>
                        <label htmlFor="post-tags" className="block text-sm font-medium text-slate-700 mb-2">
                          แท็กที่เกี่ยวข้อง
                        </label>
                        <div className="relative">
                          <input
                            id="post-tags"
                            type="text"
                            value={tagInput}
                            onChange={(e) => {
                              setTagInput(e.target.value);
                              setShowTagSuggestions(true);
                            }}
                            onFocus={() => setShowTagSuggestions(true)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                            placeholder="พิมพ์เพื่อค้นหาแท็ก..."
                          />
                          {showTagSuggestions && filteredTags.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {filteredTags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => addTag(tag)}
                                  className="w-full px-4 py-2 text-left hover:bg-blue-50 transition"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {form.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {form.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="hover:text-blue-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.directInstallment}
                            onChange={(e) => updateForm({ directInstallment: e.target.checked })}
                            className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                          />
                          <span className="text-sm text-slate-700">ผ่อนตรง</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.hotDeal}
                            onChange={(e) => updateForm({ hotDeal: e.target.checked })}
                            className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
                          />
                          <span className="text-sm text-slate-700">ดีลร้อน</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Images */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-blue-900 mb-6">อัปโหลดรูปภาพ</h2>

                      <div>
                        <label htmlFor="post-images" className="block text-sm font-medium text-slate-700 mb-2">
                          เลือกรูปภาพ (สูงสุด 10 รูป)
                        </label>
                        <input
                          id="post-images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          disabled={uploadingImages || previewFiles.length >= 10}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 disabled:opacity-50"
                        />
                      </div>

                      {previewFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {previewFiles.map((preview, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                                <img
                                  src={preview.preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {previewFiles.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>ยังไม่มีรูปภาพ</p>
                          <p className="text-sm mt-1">อัปโหลดรูปภาพเพื่อให้ประกาศของคุณน่าสนใจยิ่งขึ้น</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Contact Info */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-blue-900 mb-6">ข้อมูลติดต่อ</h2>

                      <div>
                        <label htmlFor="post-contact-name" className="block text-sm font-medium text-slate-700 mb-2">
                          ชื่อผู้ติดต่อ <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="post-contact-name"
                          type="text"
                          value={form.contactName}
                          onChange={(e) => updateForm({ contactName: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          placeholder="ชื่อของคุณ"
                        />
                      </div>

                      <div>
                        <label htmlFor="post-contact-phone" className="block text-sm font-medium text-slate-700 mb-2">
                          เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="post-contact-phone"
                          type="tel"
                          value={form.contactPhone}
                          onChange={(e) => updateForm({ contactPhone: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          placeholder="0812345678"
                        />
                      </div>

                      <div>
                        <label htmlFor="post-line-id" className="block text-sm font-medium text-slate-700 mb-2">
                          LINE ID
                        </label>
                        <input
                          id="post-line-id"
                          type="text"
                          value={form.contactLineId}
                          onChange={(e) => updateForm({ contactLineId: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                          placeholder="@lineid หรือ ID"
                        />
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.acceptedTerms}
                            onChange={(e) => updateForm({ acceptedTerms: e.target.checked })}
                            className="w-5 h-5 mt-0.5 text-blue-900 rounded focus:ring-blue-900"
                          />
                          <span className="text-sm text-slate-700">
                            <span className="text-red-500">*</span> ข้าพเจ้ายืนยันว่าข้อมูลที่ลงประกาศเป็นความจริง
                            และขอสงวนสิทธิ์ในการพิจารณาอนุมัติหรือลบประกาศที่ไม่เป็นไปตามมาตรฐานของคุณภาพจากระบบ
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={step === 1}
                      className="flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      ย้อนกลับ
                    </button>

                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition"
                      >
                        ถัดไป
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-yellow-900 font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {submitting ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-yellow-900 border-t-transparent rounded-full animate-spin" />
                            กำลังส่ง…
                          </>
                        ) : (
                          <>
                            <Check className="h-5 w-5" />
                            ส่งประกาศ
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column (3/10) */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Benefits Sidebar */}
                <div className="bg-blue-50 rounded-xl border-2 border-blue-900/20 p-6 shadow-md">
                  <h3 className="text-xl font-bold text-blue-900 mb-6 text-center">
                    ทำไมต้องลงประกาศกับเรา?
                  </h3>
                  <div className="space-y-6">
                    {benefits.map((benefit, idx) => {
                      const Icon = benefit.icon;
                      return (
                        <div key={idx} className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 mb-1">
                              {benefit.title}
                            </h4>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {benefit.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Contact Help */}
                  <div className="mt-8 pt-6 border-t border-blue-200">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 mb-1">ปรึกษาการลงประกาศ</p>
                        <Link href="/contact" className="text-base font-bold text-blue-900 hover:text-blue-700 transition">
                          ไปหน้าติดต่อเรา
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
