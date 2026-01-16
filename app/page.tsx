'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, MapPin, DollarSign, Square, Bed, FileText, Sparkles, Loader2, Building2, Key, AlertCircle, CheckCircle, TrendingUp, TrendingDown, BarChart3, Share2, Heart, History, Calculator, ArrowRight, ArrowLeft, X, Download, Copy, Check, Moon, Sun, Star, Shield, Clock, Zap } from 'lucide-react'

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

interface SavedProperty extends ApartmentData {
  id: string
  analysis: AnalysisResult
  timestamp: number
}

type FormStep = 1 | 2 | 3 | 4 | 5

const FORM_STEPS: { step: FormStep; title: string; icon: any }[] = [
  { step: 1, title: 'Mulk Turi', icon: Home },
  { step: 2, title: 'Narx va Maydon', icon: DollarSign },
  { step: 3, title: 'Joylashuv', icon: MapPin },
  { step: 4, title: 'Bino Tafsilotlari', icon: Building2 },
  { step: 5, title: 'Qo\'shimcha', icon: FileText },
]

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<FormStep>(1)
  const [darkMode, setDarkMode] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  
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
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('savedProperties')
    if (saved) {
      setSavedProperties(JSON.parse(saved))
    }
    
    const dark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleInputChange = useCallback((field: keyof ApartmentData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [formErrors])

  const validateStep = useCallback((step: FormStep): boolean => {
    const errors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.propertyType) {
        errors.propertyType = 'Mulk turini tanlang'
      }
    }
    
    if (step === 2) {
      if (!formData.price || formData.price <= 0) {
        errors.price = 'Narx kiritilishi shart'
      }
      if (!formData.size || formData.size <= 0) {
        errors.size = 'Maydon kiritilishi shart'
      }
    }
    
    if (step === 3) {
      if (!formData.city) {
        errors.city = 'Shahar tanlanishi shart'
      }
      if (!formData.district) {
        errors.district = 'Tuman/Mahalla kiritilishi shart'
      }
      if (!formData.exactLocation) {
        errors.exactLocation = 'Aniq manzil kiritilishi shart'
      }
    }
    
    if (step === 4) {
      if (!formData.rooms || formData.rooms <= 0) {
        errors.rooms = 'Xonalar soni kiritilishi shart'
      }
      if (!formData.floor || formData.floor <= 0) {
        errors.floor = 'Qavat kiritilishi shart'
      }
      if (!formData.totalFloors || formData.totalFloors <= 0) {
        errors.totalFloors = 'Umumiy qavatlar kiritilishi shart'
      }
      if (!formData.buildingType) {
        errors.buildingType = 'Bino turi tanlanishi shart'
      }
      if (!formData.condition) {
        errors.condition = 'Holati tanlanishi shart'
      }
      if (!formData.yearBuilt || formData.yearBuilt < 1900 || formData.yearBuilt > new Date().getFullYear()) {
        errors.yearBuilt = 'Qurilgan yil to\'g\'ri kiritilishi shart'
      }
    }
    
    if (step === 5) {
      if (!formData.description || formData.description.trim().length < 10) {
        errors.description = 'Tavsif kamida 10 ta belgi bo\'lishi kerak'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const nextStep = useCallback(() => {
    if (validateStep(currentStep) && currentStep < 5) {
      setCurrentStep(prev => (prev + 1) as FormStep)
    }
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as FormStep)
    }
  }, [currentStep])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(5)) {
      return
    }
    
    setIsSubmitting(true)
    setLoading(true)
    setError(null)
    setResult(null)
    setLoadingProgress(0)

    const loadingSteps = [
      { progress: 20, message: 'Bozor ma\'lumotlarini yuklash...' },
      { progress: 40, message: 'Platformalarni taqqoslash...' },
      { progress: 60, message: 'Faktorlarni tahlil qilish...' },
      { progress: 80, message: 'Natijalarni hisoblash...' },
      { progress: 100, message: 'Tayyor...' }
    ]

    for (const step of loadingSteps) {
      setLoadingProgress(step.progress)
      await new Promise(resolve => setTimeout(resolve, 300))
    }

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
      setLoadingProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const saveProperty = useCallback(() => {
    if (!result) return
    
    const newSaved: SavedProperty = {
      ...formData,
      id: Date.now().toString(),
      analysis: result,
      timestamp: Date.now()
    }
    
    const updated = [...savedProperties, newSaved].slice(-10)
    setSavedProperties(updated)
    localStorage.setItem('savedProperties', JSON.stringify(updated))
  }, [formData, result, savedProperties])

  const deleteSavedProperty = useCallback((id: string) => {
    const updated = savedProperties.filter(p => p.id !== id)
    setSavedProperties(updated)
    localStorage.setItem('savedProperties', JSON.stringify(updated))
  }, [savedProperties])

  const shareResult = useCallback(() => {
    if (!result) return
    
    const shareText = `🏠 Mulk Tahlili Natijasi\n\nBaho: ${result.score}/10\n${result.label}\n\n${result.explanation}`
    
    if (navigator.share) {
      navigator.share({
        title: 'AI Ko\'chmas Mulk Bahosi',
        text: shareText
      })
    } else {
      navigator.clipboard.writeText(shareText)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    }
  }, [result])

  const toggleFavoriteComparison = useCallback((id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      }
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }, [])

  const getStepProgress = useCallback(() => {
    return ((currentStep - 1) / 4) * 100
  }, [currentStep])

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Underpriced':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
      case 'Fair':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
      case 'Overpriced':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
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

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'from-green-500 to-emerald-600'
    if (score >= 5) return 'from-blue-500 to-indigo-600'
    if (score >= 3) return 'from-yellow-500 to-orange-600'
    return 'from-red-500 to-rose-600'
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${darkMode ? 'dark bg-gray-950' : 'minimal-bg'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className={`absolute top-20 right-20 w-64 h-64 rounded-full blur-3xl ${darkMode ? 'bg-purple-900/20' : 'bg-gradient-to-br from-gray-200/30 to-gray-300/20'}`}
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
          className={`absolute bottom-20 left-20 w-64 h-64 rounded-full blur-3xl ${darkMode ? 'bg-blue-900/20' : 'bg-gradient-to-br from-gray-300/20 to-gray-400/10'}`}
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
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl ${darkMode ? 'bg-indigo-900/10' : 'bg-gradient-to-br from-gray-100/20 to-gray-200/10'}`}
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

      <div className="relative z-10 min-h-screen flex flex-col p-4 md:p-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-7xl mx-auto w-full"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-gray-900 to-black dark:from-gray-100 dark:to-gray-300 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white dark:text-gray-900" />
              </motion.div>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'gradient-text'}`}>
                  AI Ko'chmas Mulk Bahosi
                </h1>
                <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  O'zbekiston ko'chmas mulkini aqlli tahlil qiling
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCalculator(!showCalculator)}
                className={`p-2 md:p-3 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} shadow-lg`}
                title="Kalkulyator"
              >
                <Calculator className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFavorites(!showFavorites)}
                className={`p-2 md:p-3 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} shadow-lg relative`}
                title="Saqlanganlar"
              >
                <Heart className={`w-5 h-5 ${savedProperties.length > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                {savedProperties.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {savedProperties.length}
                  </span>
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 md:p-3 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} shadow-lg`}
                title={darkMode ? 'Yorug\'lik rejim' : 'Qorong\'u rejim'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          <motion.p 
            className={`text-center text-lg md:text-xl max-w-4xl mx-auto font-light ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            AI yordamida O'zbekiston bo'ylab mulk bitimlarini tezkor baholash va tavsiyalar oling
          </motion.p>
        </motion.header>

        {/* Favorites Panel */}
        <AnimatePresence>
          {showFavorites && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-white">Saqlangan Mulkolar</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFavorites(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5 dark:text-white" />
                </motion.button>
              </div>
              
              {savedProperties.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <p className={`text-gray-500 dark:text-gray-400`}>Hozircha saqlangan mulklar yo'q</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedProperties.map((property) => (
                    <motion.div
                      key={property.id}
                      layout
                      className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${property.price} / {property.size}m²
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {property.city}, {property.district}
                          </div>
                        </div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          {property.analysis.score}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setFormData(property)
                            setResult(property.analysis)
                            setShowFavorites(false)
                          }}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          Ko'rish
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteSavedProperty(property.id)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleFavoriteComparison(property.id)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedForComparison.includes(property.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {selectedForComparison.includes(property.id) ? '✓ Taqqoslash uchun tanlangan' : 'Taqqoslash uchun tanlash'}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex-1 max-w-6xl mx-auto w-full py-8"
        >
          <div className={`rounded-3xl p-6 md:p-8 lg:p-10 shadow-2xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'card-minimal'}`}>
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                >
                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Qadam {currentStep} / 5
                      </h2>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {Math.round(getStepProgress())}% to'ldirildi
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getStepProgress()}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-400"
                      />
                    </div>
                    
                    {/* Step Indicators */}
                    <div className="flex items-center justify-between mt-6">
                      {FORM_STEPS.map((stepInfo, idx) => {
                        const StepIcon = stepInfo.icon
                        return (
                          <motion.div
                            key={stepInfo.step}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex flex-col items-center gap-2 ${
                              idx < 4 ? 'flex-1' : 'flex-none'
                            }`}
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (currentStep > stepInfo.step) {
                                  setCurrentStep(stepInfo.step)
                                }
                              }}
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                currentStep === stepInfo.step
                                  ? 'bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-300 text-white dark:text-gray-900 shadow-lg scale-110'
                                  : currentStep > stepInfo.step
                                  ? 'bg-green-500 text-white'
                                  : darkMode
                                  ? 'bg-gray-800 text-gray-400'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {currentStep > stepInfo.step ? (
                                <Check className="w-5 h-5 md:w-6 md:h-6" />
                              ) : (
                                <StepIcon className="w-5 h-5 md:w-6 md:h-6" />
                              )}
                            </motion.div>
                            <span className={`text-xs font-medium hidden md:block text-center ${
                              currentStep === stepInfo.step
                                ? 'text-gray-900 dark:text-white'
                                : darkMode
                                ? 'text-gray-500'
                                : 'text-gray-500'
                            }`}>
                              {stepInfo.title}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Step Content */}
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'gradient-text'}`}>
                            Mulk Turini Tanlang
                          </h3>
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Ijaraga yoki sotuvga e'lon joylaysizmi?
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleInputChange('propertyType', 'rent')}
                            className={`p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
                              formData.propertyType === 'rent'
                                ? 'border-gray-800 bg-gradient-to-r from-gray-800 to-black dark:border-white dark:from-white dark:to-gray-300 text-white dark:text-gray-900 shadow-xl scale-105'
                                : darkMode
                                ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:shadow-md'
                            }`}
                            aria-pressed={formData.propertyType === 'rent'}
                          >
                            <Key className="w-12 h-12 md:w-16 md:h-16 mb-4 mx-auto" />
                            <div className="text-xl md:text-2xl font-bold mb-2">Ijaraga</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Uyni ijaraga bering
                            </div>
                          </motion.button>
                          
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleInputChange('propertyType', 'sale')}
                            className={`p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
                              formData.propertyType === 'sale'
                                ? 'border-gray-800 bg-gradient-to-r from-gray-800 to-black dark:border-white dark:from-white dark:to-gray-300 text-white dark:text-gray-900 shadow-xl scale-105'
                                : darkMode
                                ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:shadow-md'
                            }`}
                            aria-pressed={formData.propertyType === 'sale'}
                          >
                            <Building2 className="w-12 h-12 md:w-16 md:h-16 mb-4 mx-auto" />
                            <div className="text-xl md:text-2xl font-bold mb-2">Sotiladi</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Uyni soting
                            </div>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'gradient-text'}`}>
                            Narx va Maydon
                          </h3>
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Mulkning narxi va maydonini kiriting
                          </p>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <DollarSign className="w-5 h-5" />
                              Narx ({formData.propertyType === 'rent' ? 'USD/oy' : 'USD'})
                            </label>
                            <input
                              type="number"
                              value={formData.price || ''}
                              onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500 focus:bg-gray-750'
                                  : `input-field ${formErrors.price ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder={formData.propertyType === 'rent' ? '500' : '50000'}
                            />
                            {formErrors.price && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.price}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Square className="w-5 h-5" />
                              Maydon (m²)
                            </label>
                            <input
                              type="number"
                              value={formData.size || ''}
                              onChange={(e) => handleInputChange('size', parseInt(e.target.value) || 0)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500 focus:bg-gray-750'
                                  : `input-field ${formErrors.size ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder="75"
                            />
                            {formErrors.size && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.size}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'gradient-text'}`}>
                            Joylashuv
                          </h3>
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Mulkning joylashgan manzilini kiriting
                          </p>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <MapPin className="w-5 h-5" />
                              Shahar
                            </label>
                            <select
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all cursor-pointer ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : `form-select ${formErrors.city ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                            >
                              <option value="">Shahar/Viloyatni tanlang</option>
                              <optgroup label="🏛️ Toshkent Shahri">
                                <option value="Toshkent Shahri">Toshkent Shahri</option>
                              </optgroup>
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
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.city}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <MapPin className="w-5 h-5" />
                              Tuman/Mahalla
                            </label>
                            <input
                              type="text"
                              value={formData.district}
                              onChange={(e) => handleInputChange('district', e.target.value)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : `input-field ${formErrors.district ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder="Chilonzor, Yunusobod, Shayxontohur..."
                            />
                            {formErrors.district && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.district}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <MapPin className="w-5 h-5" />
                              Aniq Manzil
                            </label>
                            <input
                              type="text"
                              value={formData.exactLocation}
                              onChange={(e) => handleInputChange('exactLocation', e.target.value)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : `input-field ${formErrors.exactLocation ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder="Ko'cha nomi, uy raqami..."
                            />
                            {formErrors.exactLocation && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.exactLocation}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'gradient-text'}`}>
                            Bino Tafsilotlari
                          </h3>
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Bino haqida qo'shimcha ma'lumotlar
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Bed className="w-5 h-5" />
                              Xonalar Soni
                            </label>
                            <input
                              type="number"
                              value={formData.rooms || ''}
                              onChange={(e) => handleInputChange('rooms', parseInt(e.target.value) || 0)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : `input-field ${formErrors.rooms ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder="2"
                            />
                            {formErrors.rooms && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.rooms}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Building2 className="w-5 h-5" />
                              Qavat
                            </label>
                            <input
                              type="number"
                              value={formData.floor || ''}
                              onChange={(e) => handleInputChange('floor', parseInt(e.target.value) || 0)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : `input-field ${formErrors.floor ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder="3"
                            />
                            {formErrors.floor && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.floor}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Building2 className="w-5 h-5" />
                              Umumiy Qavatlar
                            </label>
                            <input
                              type="number"
                              value={formData.totalFloors || ''}
                              onChange={(e) => handleInputChange('totalFloors', parseInt(e.target.value) || 0)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : `input-field ${formErrors.totalFloors ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder="9"
                            />
                            {formErrors.totalFloors && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.totalFloors}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Home className="w-5 h-5" />
                              Bino Turi
                            </label>
                            <select
                              value={formData.buildingType}
                              onChange={(e) => handleInputChange('buildingType', e.target.value)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all cursor-pointer ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : 'form-select'
                              }`}
                            >
                              <option value="apartment">Kvartira</option>
                              <option value="house">Uy</option>
                              <option value="studio">Studiya</option>
                              <option value="penthouse">Pentxaus</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <FileText className="w-5 h-5" />
                              Holati
                            </label>
                            <select
                              value={formData.condition}
                              onChange={(e) => handleInputChange('condition', e.target.value)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all cursor-pointer ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : 'form-select'
                              }`}
                            >
                              <option value="new">Yangi</option>
                              <option value="renovated">Ta'mirlangan</option>
                              <option value="good">Yaxshi</option>
                              <option value="needs_renovation">Ta'mirga muhtoj</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              <Building2 className="w-5 h-5" />
                              Qurilgan Yili
                            </label>
                            <input
                              type="number"
                              value={formData.yearBuilt || ''}
                              onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value) || 0)}
                              className={`w-full px-4 py-4 rounded-xl text-lg transition-all ${
                                darkMode
                                  ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                  : `input-field ${formErrors.yearBuilt ? 'border-red-500 focus:border-red-500' : ''}`
                              }`}
                              placeholder="2020"
                              min="1900"
                              max="2024"
                            />
                            {formErrors.yearBuilt && (
                              <div className="error-message flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                {formErrors.yearBuilt}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 5 && (
                      <motion.div
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'gradient-text'}`}>
                            Qo'shimcha Ma'lumotlar
                          </h3>
                          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Mulkning tavsifini kiriting
                          </p>
                        </div>
                        
                        <div>
                          <label className={`block font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <FileText className="w-5 h-5" />
                            Tavsif
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className={`w-full px-4 py-4 rounded-xl text-lg transition-all resize-none ${
                              darkMode
                                ? 'bg-gray-800 border-2 border-gray-700 text-white focus:border-gray-500'
                                : `form-textarea ${formErrors.description ? 'border-red-500 focus:border-red-500' : ''}`
                            }`}
                            placeholder="Zamonaviy kvartira, yaxshi jihozlar, jamoat transportiga yaqin, ta'mirlangan oshxona, konditsioner, internet..."
                            rows={6}
                          />
                          {formErrors.description && (
                            <div className="error-message flex items-center gap-1 mt-2">
                              <AlertCircle className="w-4 h-4" />
                              {formErrors.description}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
                    <motion.button
                      type="button"
                      whileHover={{ scale: currentStep > 1 ? 1.02 : 1 }}
                      whileTap={{ scale: currentStep > 1 ? 0.98 : 1 }}
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        currentStep === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : darkMode
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5 inline mr-2" />
                      Orqaga
                    </motion.button>
                    
                    {currentStep === 5 ? (
                      <motion.button
                        type="submit"
                        disabled={loading || isSubmitting}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="px-8 py-3 btn-primary font-semibold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Tahlil qilinmoqda...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Mulkni Tahlil Qilish
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={nextStep}
                        className="px-8 py-3 btn-primary font-semibold rounded-xl text-lg flex items-center gap-2"
                      >
                        Davom etish
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl font-medium flex items-center gap-2 ${darkMode ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-red-50 border border-red-200 text-red-700'}`}
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
                  {/* Score Header */}
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
                      className="relative inline-block"
                    >
                      <div className={`text-7xl md:text-9xl font-bold bg-gradient-to-br ${getScoreColor(result.score)} bg-clip-text text-transparent`}>
                        {result.score}
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <CheckCircle className="w-5 h-5 text-white" />
                      </motion.div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                      className={`inline-block px-8 py-4 rounded-2xl border-2 text-xl font-bold shadow-lg ${getLabelColor(result.label)}`}
                    >
                      {getLabelText(result.label)}
                    </motion.div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={saveProperty}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${darkMode ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-pink-500 text-white hover:bg-pink-600'}`}
                    >
                      <Heart className="w-4 h-4" />
                      Saqlash
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareResult}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                      {shareSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          Nusxa olindi!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          Ulashish
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setResult(null)
                        setCurrentStep(1)
                        setError(null)
                        setFormErrors({})
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      <ArrowLeft className="w-4 h-4 inline mr-2" />
                      Yangi tahlil
                    </motion.button>
                  </motion.div>

                  {/* Explanation */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {result.explanation}
                    </p>
                  </motion.div>

                  {/* Factor Breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-4"
                  >
                    <h3 className={`text-2xl font-bold text-center ${darkMode ? 'text-white' : 'gradient-text'}`}>
                      Tahlil Faktorlari
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Price Comparison */}
                      <FactorCard
                        title="💰 Narx Taqqoslash"
                        score={result.factors.priceComparison.score}
                        reason={result.factors.priceComparison.reason}
                        darkMode={darkMode}
                      >
                        <div className="text-xs font-semibold mb-2 dark:text-gray-400 text-gray-600">Platformalar bo'yicha narxlar:</div>
                        {result.factors.priceComparison.comparison.map((platform, idx) => (
                          <div key={idx} className={`flex items-center justify-between text-xs py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} last:border-0`}>
                            <span className="font-medium dark:text-white">{platform.platform}</span>
                            <div className="flex items-center gap-2">
                              <span className="dark:text-gray-300">${platform.averagePrice.toFixed(2)}/m²</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                platform.pricePosition === 'lower' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                  : platform.pricePosition === 'higher'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                              }`}>
                                {platform.pricePosition === 'lower' ? 'past' : platform.pricePosition === 'higher' ? 'yuqori' : 'o\'rtacha'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </FactorCard>

                      {/* Location */}
                      <FactorCard
                        title="📍 Joylashuv"
                        score={result.factors.location.score}
                        reason={result.factors.location.reason}
                        darkMode={darkMode}
                      />

                      {/* Building Quality */}
                      <FactorCard
                        title="🏢 Bino Sifati"
                        score={result.factors.buildingQuality.score}
                        reason={result.factors.buildingQuality.reason}
                        darkMode={darkMode}
                      />

                      {/* Amenities */}
                      <FactorCard
                        title="✨ Qulayliklar"
                        score={result.factors.amenities.score}
                        reason={result.factors.amenities.reason}
                        darkMode={darkMode}
                      />

                      {/* Size Efficiency */}
                      <FactorCard
                        title="📐 Maydon Samaradorligi"
                        score={result.factors.sizeEfficiency.score}
                        reason={result.factors.sizeEfficiency.reason}
                        darkMode={darkMode}
                        fullWidth
                      />
                    </div>
                  </motion.div>

                  {/* Market Insights */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85 }}
                    className="space-y-4"
                  >
                    <h3 className={`text-2xl font-bold text-center ${darkMode ? 'text-white' : 'gradient-text'}`}>
                      Bozor Ma'lumotlari
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <MarketInsightCard
                        icon={<DollarSign className="w-6 h-6" />}
                        label="O'rtacha Narx"
                        value={`$${result.marketInsights.averagePrice.toFixed(2)}`}
                        sublabel="per m²"
                        darkMode={darkMode}
                        gradient="from-blue-500 to-blue-600"
                      />
                      
                      <MarketInsightCard
                        icon={result.marketInsights.marketTrend.includes('o\'sib') ? <TrendingUp className="w-6 h-6" /> : result.marketInsights.marketTrend.includes('kamayib') ? <TrendingDown className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
                        label="Bozor Tendensiyasi"
                        value={result.marketInsights.marketTrend.split(' - ')[0]}
                        sublabel={result.marketInsights.marketTrend.split(' - ')[1]}
                        darkMode={darkMode}
                        gradient="from-purple-500 to-purple-600"
                      />
                      
                      <MarketInsightCard
                        icon={<Shield className="w-6 h-6" />}
                        label="Raqobat Darajasi"
                        value={result.marketInsights.competition}
                        darkMode={darkMode}
                        gradient="from-orange-500 to-orange-600"
                      />
                    </div>
                    
                    <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className={`text-sm font-semibold mb-4 dark:text-gray-400 text-gray-600`}>Narx Oralig'i (Bozor)</div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className={`text-xs dark:text-gray-500 text-gray-500 mb-1`}>Minimum</div>
                          <div className={`text-2xl font-bold dark:text-white text-gray-900`}>${result.marketInsights.priceRange.min.toFixed(2)}</div>
                        </div>
                        <div className="flex-1 mx-6 h-3 rounded-full overflow-hidden dark:bg-gray-700 bg-gray-200">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '50%' }}
                            transition={{ delay: 1.0, duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          />
                        </div>
                        <div className="text-center">
                          <div className={`text-xs dark:text-gray-500 text-gray-500 mb-1`}>Maximum</div>
                          <div className={`text-2xl font-bold dark:text-white text-gray-900`}>${result.marketInsights.priceRange.max.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
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
          className={`text-center mt-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
        >
          <p className={`flex items-center justify-center gap-2 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Bexruz tomonidan yaratilgan <span className="text-xl">🧠</span>
          </p>
        </motion.footer>
      </div>

      {/* Calculator Modal */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCalculator(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold dark:text-white`}>Ipoteka Kalkulyatori</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCalculator(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5 dark:text-white" />
                </motion.button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 dark:text-white`}>Uy narxi (USD)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800 border-2 border-gray-700 text-white' : 'input-field'}`}
                    placeholder="100000"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 dark:text-white`}>Boshlang'ich to'lov (%)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800 border-2 border-gray-700 text-white' : 'input-field'}`}
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 dark:text-white`}>Muddat (yil)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800 border-2 border-gray-700 text-white' : 'input-field'}`}
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 dark:text-white`}>Foiz stavka (%)</label>
                  <input
                    type="number"
                    className={`w-full px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-800 border-2 border-gray-700 text-white' : 'input-field'}`}
                    placeholder="12"
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 btn-primary font-semibold rounded-xl"
                >
                  Hisoblash
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FactorCard({ title, score, reason, children, darkMode, fullWidth }: {
  title: string
  score: number
  reason: string
  children?: React.ReactNode
  darkMode: boolean
  fullWidth?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} ${fullWidth ? 'md:col-span-2' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`font-bold dark:text-white`}>{title}</span>
        <div className="flex items-center gap-2">
          <div className={`w-16 h-2 rounded-full overflow-hidden dark:bg-gray-700 bg-gray-300`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score * 10}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className={`h-full ${score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-blue-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
            />
          </div>
          <span className={`text-sm font-bold ${
            score >= 7 ? 'text-green-600 dark:text-green-400' : 
            score >= 5 ? 'text-blue-600 dark:text-blue-400' : 
            score >= 3 ? 'text-yellow-600 dark:text-yellow-400' : 
            'text-red-600 dark:text-red-400'
          }`}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{reason}</p>
      {children}
    </motion.div>
  )
}

function MarketInsightCard({ icon, label, value, sublabel, darkMode, gradient }: {
  icon: React.ReactNode
  label: string
  value: string
  sublabel?: string
  darkMode: boolean
  gradient: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white`}
    >
      <div className="flex items-center gap-2 mb-2 opacity-90">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold mb-1">
        {value}
      </div>
      {sublabel && <div className="text-xs opacity-75">{sublabel}</div>}
    </motion.div>
  )
}
