'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, MapPin, DollarSign, Square, Bed, FileText, Sparkles, Loader2, Building2, Key, AlertCircle, CheckCircle } from 'lucide-react'

interface ApartmentData {
  propertyType: 'rent' | 'sale'
  price: number
  size: number
  city: string
  district: string
  exactLocation: string
  rooms: number
  floor: number
  totalFloors: number
  buildingType: 'apartment' | 'house' | 'studio' | 'penthouse'
  condition: 'new' | 'renovated' | 'good' | 'needs_renovation'
  yearBuilt: number
  description: string
}

interface AnalysisResult {
  score: number
  label: 'Underpriced' | 'Fair' | 'Overpriced'
  explanation: string
  factors: {
    priceComparison: { score: number; reason: string; comparison: PlatformComparison[] }
    location: { score: number; reason: string }
    buildingQuality: { score: number; reason: string }
    amenities: { score: number; reason: string }
    sizeEfficiency: { score: number; reason: string }
  }
  marketInsights: {
    averagePrice: number
    priceRange: { min: number; max: number }
    marketTrend: string
    competition: string
  }
}

interface PlatformComparison {
  platform: string
  averagePrice: number
  listingsCount: number
  pricePosition: 'lower' | 'average' | 'higher'
}

export default function HomePage() {
  const [formData, setFormData] = useState<ApartmentData>({
    propertyType: 'rent',
    price: 0,
    size: 0,
    city: '',
    district: '',
    exactLocation: '',
    rooms: 0,
    floor: 0,
    totalFloors: 0,
    buildingType: 'apartment',
    condition: 'good',
    yearBuilt: 0,
    description: ''
  })
  
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Optimize form validation with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formErrors).length > 0) {
        const errors: Record<string, string> = {}
        
        if (!formData.price || formData.price <= 0) {
          errors.price = 'Narx kiritilishi shart'
        }
        if (!formData.size || formData.size <= 0) {
          errors.size = 'Maydon kiritilishi shart'
        }
        if (!formData.city) {
          errors.city = 'Shahar tanlanishi shart'
        }
        if (!formData.district) {
          errors.district = 'Tuman/Mahalla kiritilishi shart'
        }
        if (!formData.exactLocation) {
          errors.exactLocation = 'Aniq manzil kiritilishi shart'
        }
        if (!formData.rooms || formData.rooms <= 0) {
          errors.rooms = 'Xonalar soni kiritilishi shart'
        }
        if (!formData.floor || formData.floor <= 0) {
          errors.floor = 'Qavat kiritilishi shart'
        }
        if (!formData.totalFloors || formData.totalFloors <= 0) {
          errors.totalFloors = 'Umumiy qavatlar kiritilishi shart'
        }
        if (!formData.yearBuilt || formData.yearBuilt < 1900 || formData.yearBuilt > new Date().getFullYear()) {
          errors.yearBuilt = 'Qurilgan yil to\'g\'ri kiritilishi shart'
        }
        if (!formData.description || formData.description.trim().length < 10) {
          errors.description = 'Tavsif kamida 10 ta belgi bo\'lishi kerak'
        }
        
        setFormErrors(errors)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [formData, formErrors])

  const handleInputChange = useCallback((field: keyof ApartmentData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [formErrors])

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.price || formData.price <= 0) {
      errors.price = 'Narx kiritilishi shart'
    }
    if (!formData.size || formData.size <= 0) {
      errors.size = 'Maydon kiritilishi shart'
    }
    if (!formData.city) {
      errors.city = 'Shahar tanlanishi shart'
    }
    if (!formData.district) {
      errors.district = 'Tuman/Mahalla kiritilishi shart'
    }
    if (!formData.exactLocation) {
      errors.exactLocation = 'Aniq manzil kiritilishi shart'
    }
    if (!formData.rooms || formData.rooms <= 0) {
      errors.rooms = 'Xonalar soni kiritilishi shart'
    }
    if (!formData.floor || formData.floor <= 0) {
      errors.floor = 'Qavat kiritilishi shart'
    }
    if (!formData.totalFloors || formData.totalFloors <= 0) {
      errors.totalFloors = 'Umumiy qavatlar kiritilishi shart'
    }
    if (!formData.yearBuilt || formData.yearBuilt < 1900 || formData.yearBuilt > new Date().getFullYear()) {
      errors.yearBuilt = 'Qurilgan yil to\'g\'ri kiritilishi shart'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'Tavsif kamida 10 ta belgi bo\'lishi kerak'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Mulkni tahlil qilishda xatolik yuz berdi')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Underpriced':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'Fair':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Overpriced':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getLabelText = (label: string) => {
    switch (label) {
      case 'Underpriced':
        return 'Arzon'
      case 'Fair':
        return 'O\'rtacha'
      case 'Overpriced':
        return 'Qimmat'
      default:
        return label
    }
  }

  return (
    <div className="min-h-screen minimal-bg relative overflow-hidden">
      {/* Minimal Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-gray-200/30 to-gray-300/20 rounded-full blur-3xl"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-gray-300/20 to-gray-400/10 rounded-full blur-3xl"
          animate={{ 
            y: [0, 20, 0],
            x: [0, -10, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-gray-100/20 to-gray-200/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8 md:mb-12 px-4"
        >
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold gradient-text mb-4 md:mb-6 tracking-tight"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            AI Ko'chmas Mulk Bahosi
          </motion.h1>
          <motion.p 
            className="text-gray-600 text-lg md:text-xl lg:text-2xl max-w-4xl font-light leading-relaxed mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            O'zbekiston ko'chmas mulki uchun aqlli tahlil. AI yordamida mulk bitimlarini tezkor baholash va tavsiyalar oling.
          </motion.p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-5xl"
        >
          <div className="card-minimal rounded-3xl p-6 md:p-8 lg:p-10 shadow-2xl pulse-glow">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-6 md:space-y-8"
                >
                  {/* Property Type Selection */}
                  <motion.div 
                    className="form-group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="form-label text-lg">Mulk Turi</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleInputChange('propertyType', 'rent')}
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 ${
                          formData.propertyType === 'rent'
                            ? 'border-gray-800 bg-gradient-to-r from-gray-800 to-black text-white shadow-lg'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:shadow-md'
                        }`}
                        aria-pressed={formData.propertyType === 'rent'}
                        aria-label="Ijaraga mulk turini tanlash"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Key className="w-5 h-5" />
                        <span className="font-medium">Ijaraga</span>
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleInputChange('propertyType', 'sale')}
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 ${
                          formData.propertyType === 'sale'
                            ? 'border-gray-800 bg-gradient-to-r from-gray-800 to-black text-white shadow-lg'
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:shadow-md'
                        }`}
                        aria-pressed={formData.propertyType === 'sale'}
                        aria-label="Sotiladigan mulk turini tanlash"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Building2 className="w-5 h-5" />
                        <span className="font-medium">Sotiladi</span>
                      </motion.button>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Price */}
                    <div className="form-group">
                      <label className="form-label">
                        <DollarSign className="w-5 h-5" />
                        Narx ({formData.propertyType === 'rent' ? 'USD/oy' : 'USD'})
                      </label>
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                        className={`form-input ${formErrors.price ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder={formData.propertyType === 'rent' ? '500' : '50000'}
                        required
                      />
                      {formErrors.price && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.price}
                        </div>
                      )}
                    </div>

                    {/* Size */}
                    <div className="form-group">
                      <label className="form-label">
                        <Square className="w-5 h-5" />
                        Maydon (m²)
                      </label>
                      <input
                        type="number"
                        value={formData.size || ''}
                        onChange={(e) => handleInputChange('size', parseInt(e.target.value) || 0)}
                        className={`form-input ${formErrors.size ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="75"
                        required
                      />
                      {formErrors.size && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.size}
                        </div>
                      )}
                    </div>

                    {/* City */}
                    <div className="form-group">
                      <label className="form-label">
                        <MapPin className="w-5 h-5" />
                        Shahar
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`form-select ${formErrors.city ? 'border-red-500 focus:border-red-500' : ''}`}
                        required
                      >
                        <option value="">Shahar/Viloyatni tanlang</option>
                        
                        {/* Tashkent City (Separate from Tashkent Region) */}
                        <optgroup label="🏛️ Toshkent Shahri">
                          <option value="Toshkent Shahri">Toshkent Shahri</option>
                        </optgroup>
                        
                        {/* 14 Regions (Viloyatlar) */}
                        <optgroup label="📍 Viloyatlar">
                          <option value="Toshkent Viloyati">Toshkent Viloyati</option>
                          <option value="Andijon Viloyati">Andijon Viloyati</option>
                          <option value="Buxoro Viloyati">Buxoro Viloyati</option>
                          <option value="Farg'ona Viloyati">Farg'ona Viloyati</option>
                          <option value="Jizzax Viloyati">Jizzax Viloyati</option>
                          <option value="Qashqadaryo Viloyati">Qashqadaryo Viloyati</option>
                          <option value="Xorazm Viloyati">Xorazm Viloyati</option>
                          <option value="Namangan Viloyati">Namangan Viloyati</option>
                          <option value="Navoiy Viloyati">Navoiy Viloyati</option>
                          <option value="Samarqand Viloyati">Samarqand Viloyati</option>
                          <option value="Sirdaryo Viloyati">Sirdaryo Viloyati</option>
                          <option value="Surxondaryo Viloyati">Surxondaryo Viloyati</option>
                          <option value="Qoraqalpog'iston Respublikasi">Qoraqalpog'iston Respublikasi</option>
                        </optgroup>
                        
                        {/* Major Cities */}
                        <optgroup label="🏙️ Yirik Shaharlar">
                          <option value="Samarqand">Samarqand</option>
                          <option value="Buxoro">Buxoro</option>
                          <option value="Namangan">Namangan</option>
                          <option value="Andijon">Andijon</option>
                          <option value="Nukus">Nukus</option>
                          <option value="Qo'qon">Qo'qon</option>
                          <option value="Marg'ilon">Marg'ilon</option>
                          <option value="Urganch">Urganch</option>
                          <option value="Navoiy">Navoiy</option>
                          <option value="Jizzax">Jizzax</option>
                          <option value="Termiz">Termiz</option>
                          <option value="Guliston">Guliston</option>
                          <option value="Qarshi">Qarshi</option>
                          <option value="Chirchiq">Chirchiq</option>
                          <option value="Angren">Angren</option>
                          <option value="Bekobod">Bekobod</option>
                          <option value="Denov">Denov</option>
                          <option value="Kattaqo'rg'on">Kattaqo'rg'on</option>
                        </optgroup>
                        
                        <option value="Boshqa">Boshqa</option>
                      </select>
                      {formErrors.city && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.city}
                        </div>
                      )}
                    </div>

                    {/* District */}
                    <div className="form-group">
                      <label className="form-label">
                        <MapPin className="w-5 h-5" />
                        Tuman/Mahalla
                      </label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        className={`form-input ${formErrors.district ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Chilonzor, Yunusobod, Shayxontohur..."
                        required
                      />
                      {formErrors.district && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.district}
                        </div>
                      )}
                    </div>

                    {/* Exact Location */}
                    <div className="form-group">
                      <label className="form-label">
                        <MapPin className="w-5 h-5" />
                        Aniq Manzil
                      </label>
                      <input
                        type="text"
                        value={formData.exactLocation}
                        onChange={(e) => handleInputChange('exactLocation', e.target.value)}
                        className={`form-input ${formErrors.exactLocation ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Ko'cha nomi, uy raqami..."
                        required
                      />
                      {formErrors.exactLocation && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.exactLocation}
                        </div>
                      )}
                    </div>

                    {/* Rooms */}
                    <div className="form-group">
                      <label className="form-label">
                        <Bed className="w-5 h-5" />
                        Xonalar Soni
                      </label>
                      <input
                        type="number"
                        value={formData.rooms || ''}
                        onChange={(e) => handleInputChange('rooms', parseInt(e.target.value) || 0)}
                        className={`form-input ${formErrors.rooms ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="2"
                        required
                      />
                      {formErrors.rooms && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.rooms}
                        </div>
                      )}
                    </div>

                    {/* Floor */}
                    <div className="form-group">
                      <label className="form-label">
                        <Building2 className="w-5 h-5" />
                        Qavat
                      </label>
                      <input
                        type="number"
                        value={formData.floor || ''}
                        onChange={(e) => handleInputChange('floor', parseInt(e.target.value) || 0)}
                        className={`form-input ${formErrors.floor ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="3"
                        required
                      />
                      {formErrors.floor && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.floor}
                        </div>
                      )}
                    </div>

                    {/* Total Floors */}
                    <div className="form-group">
                      <label className="form-label">
                        <Building2 className="w-5 h-5" />
                        Umumiy Qavatlar
                      </label>
                      <input
                        type="number"
                        value={formData.totalFloors || ''}
                        onChange={(e) => handleInputChange('totalFloors', parseInt(e.target.value) || 0)}
                        className={`form-input ${formErrors.totalFloors ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="9"
                        required
                      />
                      {formErrors.totalFloors && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.totalFloors}
                        </div>
                      )}
                    </div>

                    {/* Building Type */}
                    <div className="form-group">
                      <label className="form-label">
                        <Home className="w-5 h-5" />
                        Bino Turi
                      </label>
                      <select
                        value={formData.buildingType}
                        onChange={(e) => handleInputChange('buildingType', e.target.value)}
                        className="form-select"
                        required
                      >
                        <option value="apartment">Kvartira</option>
                        <option value="house">Uy</option>
                        <option value="studio">Studiya</option>
                        <option value="penthouse">Pentxaus</option>
                      </select>
                    </div>

                    {/* Condition */}
                    <div className="form-group">
                      <label className="form-label">
                        <FileText className="w-5 h-5" />
                        Holati
                      </label>
                      <select
                        value={formData.condition}
                        onChange={(e) => handleInputChange('condition', e.target.value)}
                        className="form-select"
                        required
                      >
                        <option value="new">Yangi</option>
                        <option value="renovated">Ta'mirlangan</option>
                        <option value="good">Yaxshi</option>
                        <option value="needs_renovation">Ta'mirga muhtoj</option>
                      </select>
                    </div>

                    {/* Year Built */}
                    <div className="form-group">
                      <label className="form-label">
                        <Building2 className="w-5 h-5" />
                        Qurilgan Yili
                      </label>
                      <input
                        type="number"
                        value={formData.yearBuilt || ''}
                        onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value) || 0)}
                        className={`form-input ${formErrors.yearBuilt ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="2020"
                        min="1900"
                        max="2024"
                        required
                      />
                      {formErrors.yearBuilt && (
                        <div className="error-message flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.yearBuilt}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label">
                      <FileText className="w-5 h-5" />
                      Tavsif
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`form-textarea ${formErrors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Zamonaviy kvartira, yaxshi jihozlar, jamoat transportiga yaqin, ta'mirlangan oshxona, konditsioner, internet..."
                      rows={4}
                      required
                    />
                    {formErrors.description && (
                      <div className="error-message flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {formErrors.description}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || isSubmitting}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-4 md:py-5 btn-primary text-white font-semibold rounded-xl text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                      <span className="hidden sm:inline">AI tahlil qilmoqda...</span>
                      <span className="sm:hidden">Tahlil...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="hidden sm:inline">Mulkni Tahlil Qilish</span>
                      <span className="sm:hidden">Tahlil Qilish</span>
                    </>
                  )}
                  </motion.button>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </motion.form>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Score and Label */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                      className="text-6xl md:text-8xl font-bold gradient-text bounce-in relative inline-block"
                    >
                      {result.score}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </motion.div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                      className={`inline-block px-6 md:px-8 py-3 md:py-4 rounded-2xl border-2 ${getLabelColor(result.label)} font-bold text-lg md:text-xl shadow-lg`}
                    >
                      {getLabelText(result.label)}
                    </motion.div>
                  </motion.div>

                  {/* Explanation */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-gray-700 text-lg leading-relaxed max-w-3xl px-4 md:px-8"
                  >
                    {result.explanation}
                  </motion.div>

                  {/* Factor Breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="px-4 md:px-8 space-y-4"
                  >
                    <h3 className="text-xl md:text-2xl font-bold text-center mb-6 gradient-text">Tahlil Faktorlari</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Price Comparison */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">💰 Narx Taqqoslash</span>
                          <span className={`text-sm font-bold ${result.factors.priceComparison.score >= 6 ? 'text-green-600' : result.factors.priceComparison.score >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {result.factors.priceComparison.score.toFixed(1)}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{result.factors.priceComparison.reason}</p>
                        <div className="text-xs text-gray-500 font-medium mb-2">Platformalar bo'yicha narxlar:</div>
                        {result.factors.priceComparison.comparison.map((platform, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-200 last:border-0">
                            <span className="font-medium">{platform.platform}</span>
                            <span className="flex items-center gap-2">
                              <span>${platform.averagePrice.toFixed(2)}/m²</span>
                              <span className={`px-2 py-0.5 rounded ${platform.pricePosition === 'lower' ? 'bg-green-100 text-green-700' : platform.pricePosition === 'higher' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {platform.pricePosition === 'lower' ? 'past' : platform.pricePosition === 'higher' ? 'yuqori' : 'o\'rtacha'}
                              </span>
                            </span>
                          </div>
                        ))}
                      </motion.div>

                      {/* Location */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.75 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">📍 Joylashuv</span>
                          <span className={`text-sm font-bold ${result.factors.location.score >= 6 ? 'text-green-600' : result.factors.location.score >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {result.factors.location.score.toFixed(1)}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{result.factors.location.reason}</p>
                      </motion.div>

                      {/* Building Quality */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">🏢 Bino Sifati</span>
                          <span className={`text-sm font-bold ${result.factors.buildingQuality.score >= 6 ? 'text-green-600' : result.factors.buildingQuality.score >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {result.factors.buildingQuality.score.toFixed(1)}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{result.factors.buildingQuality.reason}</p>
                      </motion.div>

                      {/* Amenities */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.85 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">✨ Qulayliklar</span>
                          <span className={`text-sm font-bold ${result.factors.amenities.score >= 6 ? 'text-green-600' : result.factors.amenities.score >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {result.factors.amenities.score.toFixed(1)}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{result.factors.amenities.reason}</p>
                      </motion.div>

                      {/* Size Efficiency */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200 md:col-span-2"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">📐 Maydon Samaradorligi</span>
                          <span className={`text-sm font-bold ${result.factors.sizeEfficiency.score >= 6 ? 'text-green-600' : result.factors.sizeEfficiency.score >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {result.factors.sizeEfficiency.score.toFixed(1)}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{result.factors.sizeEfficiency.reason}</p>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Market Insights */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.95 }}
                    className="px-4 md:px-8"
                  >
                    <h3 className="text-xl md:text-2xl font-bold text-center mb-6 gradient-text">Bozor Ma'lumotlari</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="text-sm text-blue-800 font-semibold mb-1">O'rtacha Narx</div>
                        <div className="text-2xl md:text-3xl font-bold text-blue-900">
                          ${result.marketInsights.averagePrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">per m²</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="text-sm text-purple-800 font-semibold mb-1">Bozor Tendensiyasi</div>
                        <div className="text-sm md:text-base font-bold text-purple-900">
                          {result.marketInsights.marketTrend}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="text-sm text-orange-800 font-semibold mb-1">Raqobat Darajasi</div>
                        <div className="text-sm md:text-base font-bold text-orange-900">
                          {result.marketInsights.competition}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="text-sm text-gray-600 font-semibold mb-2">Narx Oralig'i (Bozor)</div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Minimum</div>
                          <div className="text-lg font-bold text-gray-800">${result.marketInsights.priceRange.min.toFixed(2)}</div>
                        </div>
                        <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '50%' }}
                            transition={{ delay: 1.0, duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Maximum</div>
                          <div className="text-lg font-bold text-gray-800">${result.marketInsights.priceRange.max.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Try Again Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="text-center px-4 md:px-8 pt-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setResult(null)
                        setError(null)
                        setFormErrors({})
                      }}
                      className="px-8 md:px-10 py-3 md:py-4 btn-secondary font-semibold rounded-xl text-base md:text-lg transition-all duration-300"
                    >
                      <span className="hidden sm:inline">Boshqa Mulkni Tahlil Qilish</span>
                      <span className="sm:hidden">Boshqa Tahlil</span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-8 md:mt-16 text-gray-500 text-center px-4"
        >
          <p className="flex items-center justify-center gap-2 text-base md:text-lg font-medium">
            Bexruz tomonidan yaratilgan <span className="text-lg md:text-xl">🧠</span>
          </p>
        </motion.footer>
      </div>
    </div>
  )
}

