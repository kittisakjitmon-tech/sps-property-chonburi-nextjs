'use client';

import { useState } from 'react';
import { MapPin, Globe, Mail, Clock, Phone, MessageCircle, Send } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!formData.phone.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Submit to Firebase/Firestore
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
      setFormData({ name: '', phone: '', message: '' });
    } catch (err) {
      console.error('Error submitting:', err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      label: 'อีเมล',
      value: 'propertysommai@gmail.com',
      href: 'mailto:propertysommai@gmail.com',
    },
    {
      icon: Send,
      label: 'Facebook',
      value: 'houseamata',
      href: 'https://facebook.com/houseamata',
    },
    {
      icon: Clock,
      label: 'เวลาทำการ',
      value: 'เปิดทำการตลอด 24/7',
      href: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center py-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">ติดต่อเรา</h1>
          <p className="text-xl text-white/80">บ้านคอนโดสวย อมตะซิตี้ ชลบุรี</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Contact Info & Map */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-blue-900 mb-2">SPS Property Solutions</h2>
                <p className="text-gray-500 text-sm mb-6">ผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ อมตะซิตี้ ชลบุรี</p>

                {/* Contact Details */}
                <div className="space-y-4 mb-6">
                  {/* Address */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-blue-900" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">ที่อยู่</p>
                      <p className="text-sm text-gray-600">
                        99/199 หมู่บ้านกิตติพรพอร์ต ซอยอมตะพัฒน์ 15<br />
                        ตำบลอมตะ อำเภอเมืองชลบุรี<br />
                        จังหวัดชลบุรี 20000
                      </p>
                    </div>
                  </div>

                  {/* Service Area */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-blue-900" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">พื้นที่บริการ</p>
                      <p className="text-sm text-gray-600">
                        ชลบุรี | พานทอง | บ้านบึง | ศรีราชา<br />
                        ฉะเชิงเทรา | ระยอง | พระประแกศ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Methods */}
                <div className="space-y-3">
                  {contactMethods.map((method, idx) => {
                    const Icon = method.icon;
                    const content = (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{method.label}</p>
                          <p className="font-medium text-gray-900">{method.value}</p>
                        </div>
                      </div>
                    );

                    return method.href ? (
                      <a key={idx} href={method.href} target="_blank" rel="noopener noreferrer" className="block">
                        {content}
                      </a>
                    ) : (
                      <div key={idx}>{content}</div>
                    );
                  })}
                </div>
              </div>

              {/* Google Maps */}
              <div className="rounded-xl overflow-hidden shadow-sm">
                <iframe
                  src="https://maps.google.com/maps?q=อมตะชลบุรี&output=embed"
                  className="w-full h-[300px] border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SPS Property Location"
                />
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-blue-900 mb-2">ส่งข้อความถึงเรา</h2>
              <p className="text-gray-500 text-sm mb-6">กรอกข้อมูลด้านล่าง ทีมงานจะติดต่อกลับโดยเร็ว</p>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">ส่งข้อความสำเร็จ!</h3>
                  <p className="text-gray-600 mb-6">ขอบคุณที่ติดต่อ ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition"
                  >
                    ส่งข้อความใหม่
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ-นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="กรอกชื่อ-นามสกุล"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="เช่น 0812345678"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                      ข้อความ <span className="text-gray-400">(ถ้ามี)</span>
                    </label>
                    <textarea
                      id="contact-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      placeholder="ระบุคำถามหรือความต้องการ..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        ส่งข้อความ
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Quick Contact */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500 mb-4">หรือติดต่อเราได้โดยตรง</p>
                <div className="flex gap-3">
                  <a
                    href="tel:0891234567"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    โทรเลย
                  </a>
                  <a
                    href="https://line.me/ti/p/~spsproperty"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-400 hover:bg-green-500 text-white font-medium rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    แชท LINE
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
