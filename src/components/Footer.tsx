import Link from "next/link";
import { Mail, Clock, MapPin, MessageCircle } from "lucide-react";
import { CONTACT, PRIMARY_CHAT_LABEL, PRIMARY_CHAT_URL } from "@/constants/contact";
import OptimizedImage from "@/components/OptimizedImage";

const popularSearches = [
  { label: "ขายอสังหาริมทรัพย์ ชลบุรี", href: "/properties?listingType=sale&location=ชลบุรี" },
  { label: "ขายอสังหาริมทรัพย์ พานทอง", href: "/properties?listingType=sale&location=พานทอง" },
  { label: "อสังหาริมทรัพย์ให้เช่า ศรีราชา", href: "/properties?listingType=rent&location=ศรีราชา" },
  { label: "บ้านผ่อนตรง ชลบุรี", href: "/properties?subListingType=installment_only&location=ชลบุรี" },
];

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex items-center gap-4">
              <OptimizedImage src="/logo.png" alt="SPS Property Solution" width={48} height={48} className="w-12 h-12 object-contain rounded-xl" />
              <div>
                <p className="font-bold text-lg">SPS Property Solution</p>
                <p className="text-blue-200 text-sm">บ้านคอนโดสวย อมตะซิตี้ ชลบุรี</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 text-sm">
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-yellow-400 transition">
                <Mail className="h-4 w-4 shrink-0" />
                {CONTACT.email}
              </a>
              <a href={PRIMARY_CHAT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-yellow-400 transition">
                <MessageCircle className="h-4 w-4 shrink-0" />
                แชทผ่าน {PRIMARY_CHAT_LABEL}
              </a>
              <div className="flex items-center gap-2 text-blue-200">
                <Clock className="h-4 w-4 shrink-0" />
                เปิดทำการตลอดเวลา (24/7)
              </div>
            </div>
          </div>

          <nav aria-label="การค้นหายอดนิยม" className="mt-8 pt-6 border-t border-blue-800">
            <h2 className="text-sm font-semibold text-white mb-4">การค้นหายอดนิยม</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm text-blue-200">
              {popularSearches.map((search) => (
                <li key={search.href}>
                  <Link href={search.href} className="inline-flex min-h-[32px] items-center hover:text-yellow-400 transition">
                    {search.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6 pt-6 border-t border-blue-800">
            <div className="flex items-center gap-2 text-blue-200 text-sm">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-blue-800 text-center text-blue-200 text-sm">
            <p>© {new Date().getFullYear()} SPS Property Solution | บ้านคอนโดสวย อมตะซิตี้ ชลบุรี</p>
            <p className="mt-2">
              <a href={PRIMARY_CHAT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[32px] items-center hover:text-yellow-400 transition">
                ติดต่อเราผ่าน {PRIMARY_CHAT_LABEL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}