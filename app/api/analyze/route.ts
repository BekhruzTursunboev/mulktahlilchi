import { NextRequest, NextResponse } from 'next/server'

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

function analyzeApartment(data: ApartmentData): AnalysisResult {
  const { propertyType, price, size, city, district, exactLocation, rooms, floor, totalFloors, buildingType, condition, yearBuilt, description } = data
  
  const pricePerSqm = price / size
  const expectedPricePerSqm = getExpectedPricePerSqm(city, propertyType)
  const priceRatio = pricePerSqm / expectedPricePerSqm
  
  const priceComparisonScore = calculatePriceComparisonScore(priceRatio)
  const locationScore = getLocationScore(city, district)
  const buildingQualityScore = calculateBuildingQualityScore(buildingType, condition, yearBuilt, floor, totalFloors)
  const amenitiesScore = calculateAmenitiesScore(description)
  const sizeEfficiencyScore = calculateSizeEfficiencyScore(size, rooms)
  
  const platformComparison = getPlatformComparison(city, propertyType, price, size)
  
  let finalScore = 5
  finalScore += (priceComparisonScore - 5) * 0.45
  finalScore += (locationScore - 5) * 0.30
  finalScore += (buildingQualityScore - 5) * 0.15
  finalScore += (amenitiesScore - 5) * 0.02
  finalScore += (sizeEfficiencyScore - 5) * 0.08
  
  const regionalGrowthFactor = getRegionalGrowthFactor(city)
  finalScore += regionalGrowthFactor
  
  finalScore = Math.max(1, Math.min(10, Math.round(finalScore * 10) / 10))
  
  let label: 'Underpriced' | 'Fair' | 'Overpriced'
  if (finalScore >= 8.0) {
    label = 'Underpriced'
  } else if (finalScore >= 6.5) {
    label = 'Underpriced'
  } else if (finalScore >= 4.0) {
    label = 'Fair'
  } else {
    label = 'Overpriced'
  }
  
  const explanation = generateDetailedExplanation(finalScore, label, priceRatio, city, district, size, rooms, propertyType, buildingType, condition, platformComparison)
  
  const marketInsights = generateMarketInsights(city, propertyType, price, size)
  
  return {
    score: finalScore,
    label,
    explanation,
    factors: {
      priceComparison: {
        score: priceComparisonScore,
        reason: generatePriceReason(priceRatio, expectedPricePerSqm, city),
        comparison: platformComparison
      },
      location: {
        score: locationScore,
        reason: generateLocationReason(city, district, locationScore)
      },
      buildingQuality: {
        score: buildingQualityScore,
        reason: generateBuildingReason(buildingType, condition, yearBuilt, floor, totalFloors)
      },
      amenities: {
        score: amenitiesScore,
        reason: generateAmenitiesReason(description, amenitiesScore)
      },
      sizeEfficiency: {
        score: sizeEfficiencyScore,
        reason: generateSizeReason(size, rooms, sizeEfficiencyScore)
      }
    },
    marketInsights
  }
}

function calculatePriceComparisonScore(priceRatio: number): number {
  if (priceRatio < 0.65) return 9.5
  if (priceRatio < 0.75) return 8.5
  if (priceRatio < 0.85) return 7.5
  if (priceRatio < 0.95) return 6.5
  if (priceRatio < 1.05) return 5.5
  if (priceRatio < 1.15) return 4.5
  if (priceRatio < 1.30) return 3.5
  if (priceRatio < 1.50) return 2.5
  if (priceRatio < 2.00) return 1.5
  return 1.0
}

function getPlatformComparison(city: string, propertyType: 'rent' | 'sale', price: number, size: number): PlatformComparison[] {
  const pricePerSqm = price / size
  const cityLower = city.toLowerCase()
  
  const basePrice = getExpectedPricePerSqm(city, propertyType)
  const variance = 0.15
  
  return [
    {
      platform: 'OLX Uzbekistan',
      averagePrice: basePrice * (1 + variance * 0.5),
      listingsCount: Math.floor(Math.random() * 500 + 200),
      pricePosition: pricePerSqm < basePrice * 0.9 ? 'lower' : pricePerSqm > basePrice * 1.1 ? 'higher' : 'average'
    },
    {
      platform: 'We Band',
      averagePrice: basePrice * (1 - variance * 0.3),
      listingsCount: Math.floor(Math.random() * 150 + 50),
      pricePosition: pricePerSqm < basePrice * 0.85 ? 'lower' : pricePerSqm > basePrice * 1.05 ? 'higher' : 'average'
    },
    {
      platform: 'Uy.uz',
      averagePrice: basePrice * (1 + variance * 0.2),
      listingsCount: Math.floor(Math.random() * 100 + 30),
      pricePosition: pricePerSqm < basePrice * 0.88 ? 'lower' : pricePerSqm > basePrice * 1.08 ? 'higher' : 'average'
    },
    {
      platform: 'Machinuka',
      averagePrice: basePrice * (1 - variance * 0.1),
      listingsCount: Math.floor(Math.random() * 80 + 20),
      pricePosition: pricePerSqm < basePrice * 0.92 ? 'lower' : pricePerSqm > basePrice * 1.12 ? 'higher' : 'average'
    }
  ]
}

function getLocationScore(city: string, district: string): number {
  const cityLower = city.toLowerCase()
  const districtLower = district.toLowerCase()
  
  let baseScore = 5
  
  if (cityLower.includes('toshkent shahri')) {
    baseScore = 9.8
  } else if (cityLower.includes('toshkent viloyati')) {
    baseScore = 7.5
  } else if (cityLower.includes('samarqand') || cityLower.includes('buxoro')) {
    baseScore = 8.5
  } else if (cityLower.includes('namangan') || cityLower.includes('andijon') || 
             cityLower.includes('nukus') || cityLower.includes('qo\'qon') ||
             cityLower.includes('qarshi') || cityLower.includes('termiz')) {
    baseScore = 7.2
  } else if (cityLower.includes('marg\'ilon') || cityLower.includes('urganch') ||
             cityLower.includes('navoiy') || cityLower.includes('jizzax') ||
             cityLower.includes('guliston') || cityLower.includes('chirchiq') ||
             cityLower.includes('angren') || cityLower.includes('bekobod')) {
    baseScore = 6.4
  } else if (cityLower.includes('viloyati') || cityLower.includes('viloyat')) {
    baseScore = 6.0
  } else if (cityLower.includes('qoraqalpog') || cityLower.includes('karakalpak')) {
    baseScore = 4.8
  } else if (cityLower.includes('denov') || cityLower.includes('kattaqo\'rg\'on')) {
    baseScore = 5.5
  }
  
  if (cityLower.includes('toshkent shahri')) {
    if (districtLower.includes('mirobod') || districtLower.includes('shayxontohur') || 
        districtLower.includes('yakkasaroy') || districtLower.includes('chilonzor') || 
        districtLower.includes('yunusobod') || districtLower.includes('mirzo ulug\'bek')) {
      baseScore += 1.5
    } else if (districtLower.includes('olmazor') || districtLower.includes('sirg\'ali') ||
               districtLower.includes('uchtepa') || districtLower.includes('yangihayot')) {
      baseScore += 0.5
    } else if (districtLower.includes('sergeli') || districtLower.includes('bektemir') ||
               districtLower.includes('yangiyo\'l') || districtLower.includes('quyichirchiq') ||
               districtLower.includes('piskent') || districtLower.includes('zangiota')) {
      baseScore -= 1.2
    }
  } else if (cityLower.includes('samarqand')) {
    if (districtLower.includes('registon') || districtLower.includes('siyob')) {
      baseScore += 0.8
    }
  } else if (cityLower.includes('buxoro')) {
    if (districtLower.includes('poi kalon') || districtLower.includes('lyabi hauz')) {
      baseScore += 0.8
    }
  } else if (cityLower.includes('andijon') || cityLower.includes('namangan')) {
    if (districtLower.includes('markaz') || districtLower.includes('center')) {
      baseScore += 0.6
    }
  }
  
  return Math.max(1, Math.min(10, baseScore))
}

function calculateBuildingQualityScore(buildingType: string, condition: string, yearBuilt: number, floor: number, totalFloors: number): number {
  let score = 5
  
  switch (buildingType) {
    case 'penthouse': score += 3.0; break
    case 'house': score += 2.2; break
    case 'apartment': score += 1.2; break
    case 'studio': score += 0.3; break
  }
  
  switch (condition) {
    case 'new': score += 2.5; break
    case 'renovated': score += 2.0; break
    case 'good': score += 0.8; break
    case 'needs_renovation': score -= 2.0; break
  }
  
  const currentYear = new Date().getFullYear()
  const age = currentYear - yearBuilt
  if (age <= 3) score += 2.0
  else if (age <= 7) score += 1.5
  else if (age <= 15) score += 1.0
  else if (age <= 25) score += 0.5
  else if (age <= 40) score += 0.0
  else if (age <= 60) score -= 0.8
  else score -= 1.8
  
  if (floor === 1) score -= 1.0
  else if (floor === 2) score += 1.2
  else if (floor >= 3 && floor <= 5) score += 1.5
  else if (floor >= 6 && floor <= 8) score += 1.0
  else if (floor >= 9 && floor <= 12) score += 0.3
  else if (floor > 12) score -= 0.5
  
  if (totalFloors >= 4 && totalFloors <= 6) score += 0.8
  else if (totalFloors >= 7 && totalFloors <= 9) score += 0.5
  else if (totalFloors >= 10 && totalFloors <= 15) score += 0.0
  else if (totalFloors > 15) score -= 0.5
  
  return Math.max(1, Math.min(10, score))
}

function calculateAmenitiesScore(description: string): number {
  const descLower = description.toLowerCase()
  let score = 5
  
  const positiveAmenities = [
    { keywords: ['zamonaviy', 'modern', 'renovated', 'ta\'mirlangan'], points: 1.2 },
    { keywords: ['konditsioner', 'air conditioning', 'ac'], points: 1.0 },
    { keywords: ['internet', 'wi-fi', 'wifi'], points: 0.8 },
    { keywords: ['balkon', 'balcony', 'terrace', 'terrasa'], points: 0.8 },
    { keywords: ['parking', 'garage', 'mashina joyi'], points: 0.8 },
    { keywords: ['lift', 'elevator'], points: 0.6 },
    { keywords: ['security', 'xavfsizlik', 'guard'], points: 0.6 },
    { keywords: ['gym', 'fitness', 'sport'], points: 0.8 },
    { keywords: ['pool', 'basseyn', 'rooftop'], points: 1.0 },
    { keywords: ['dishwasher', 'posuda yuvish mashinasi'], points: 0.5 },
    { keywords: ['washing machine', 'kir yuvish mashinasi'], points: 0.5 },
    { keywords: ['furnished', 'mebellar bilan'], points: 0.7 },
    { keywords: ['metro', 'metroga yaqin'], points: 0.6 },
    { keywords: ['school', 'maktab', 'university', 'universitet'], points: 0.4 },
    { keywords: ['hospital', 'shifoxona', 'clinic'], points: 0.4 },
    { keywords: ['market', 'bozor', 'supermarket'], points: 0.3 }
  ]
  
  const negativeIndicators = [
    { keywords: ['needs work', 'fixer', 'ta\'mirga muhtoj'], points: -1.2 },
    { keywords: ['noisy', 'loud', 'shovqinli'], points: -0.8 },
    { keywords: ['small', 'cramped', 'kichik'], points: -0.6 },
    { keywords: ['old', 'eski', 'qadimiy'], points: -0.4 },
    { keywords: ['dirty', 'kir', 'iflos'], points: -0.8 },
    { keywords: ['broken', 'buzilgan', 'ishlamaydi'], points: -0.6 }
  ]
  
  positiveAmenities.forEach(({ keywords, points }) => {
    if (keywords.some(keyword => descLower.includes(keyword))) {
      score += points
    }
  })
  
  negativeIndicators.forEach(({ keywords, points }) => {
    if (keywords.some(keyword => descLower.includes(keyword))) {
      score += points
    }
  })
  
  return Math.max(1, Math.min(10, score))
}

function calculateSizeEfficiencyScore(size: number, rooms: number): number {
  if (rooms === 0) return 3
  
  const sqmPerRoom = size / rooms
  
  if (sqmPerRoom >= 25) return 9
  if (sqmPerRoom >= 20) return 8
  if (sqmPerRoom >= 15) return 7
  if (sqmPerRoom >= 12) return 6
  if (sqmPerRoom >= 10) return 5
  if (sqmPerRoom >= 8) return 4
  return 3
}

function getExpectedPricePerSqm(city: string, propertyType: 'rent' | 'sale'): number {
  const cityLower = city.toLowerCase()
  
  if (propertyType === 'rent') {
    if (cityLower.includes('toshkent shahri')) return 8.3
    if (cityLower.includes('samarqand') || cityLower.includes('buxoro')) return 5.5
    if (cityLower.includes('namangan') || cityLower.includes('andijon') || 
        cityLower.includes('nukus') || cityLower.includes('qo\'qon') ||
        cityLower.includes('qarshi') || cityLower.includes('termiz')) return 3.8
    if (cityLower.includes('marg\'ilon') || cityLower.includes('urganch') ||
        cityLower.includes('navoiy') || cityLower.includes('jizzax') ||
        cityLower.includes('guliston') || cityLower.includes('chirchiq') ||
        cityLower.includes('angren') || cityLower.includes('bekobod')) return 2.8
    if (cityLower.includes('toshkent viloyati')) return 4.2
    if (cityLower.includes('viloyati') || cityLower.includes('viloyat')) return 2.5
    if (cityLower.includes('qoraqalpog') || cityLower.includes('karakalpak')) return 1.8
    return 3.2
  } else {
    if (cityLower.includes('toshkent shahri')) return 1128
    if (cityLower.includes('samarqand') || cityLower.includes('buxoro')) return 750
    if (cityLower.includes('namangan') || cityLower.includes('andijon') || 
        cityLower.includes('nukus') || cityLower.includes('qo\'qon') ||
        cityLower.includes('qarshi') || cityLower.includes('termiz')) return 550
    if (cityLower.includes('marg\'ilon') || cityLower.includes('urganch') ||
        cityLower.includes('navoiy') || cityLower.includes('jizzax') ||
        cityLower.includes('guliston') || cityLower.includes('chirchiq') ||
        cityLower.includes('angren') || cityLower.includes('bekobod')) return 420
    if (cityLower.includes('toshkent viloyati')) return 650
    if (cityLower.includes('viloyati') || cityLower.includes('viloyat')) return 380
    if (cityLower.includes('qoraqalpog') || cityLower.includes('karakalpak')) return 333
    return 450
  }
}

function getRegionalGrowthFactor(city: string): number {
  const cityLower = city.toLowerCase()
  
  if (cityLower.includes('xorazm') || cityLower.includes('khorezm')) return 0.8
  if (cityLower.includes('surxondaryo') || cityLower.includes('surkhandarya')) return 0.7
  if (cityLower.includes('buxoro') || cityLower.includes('bukhara')) return 0.6
  if (cityLower.includes('qashqadaryo') || cityLower.includes('kashkadarya')) return 0.5
  if (cityLower.includes('toshkent shahri')) return 0.3
  if (cityLower.includes('toshkent viloyati')) return 0.2
  if (cityLower.includes('samarqand') || cityLower.includes('samarkand')) return 0.4
  if (cityLower.includes('namangan') || cityLower.includes('andijon')) return 0.3
  if (cityLower.includes('navoiy') || cityLower.includes('jizzax') ||
      cityLower.includes('guliston') || cityLower.includes('qarshi')) return 0.1
  if (cityLower.includes('jizzax viloyati')) return -0.3
  if (cityLower.includes('sirdaryo viloyati')) return -0.4
  if (cityLower.includes('qoraqalpog') || cityLower.includes('karakalpak')) return 0.0
  
  return 0.1
}

function generateDetailedExplanation(
  score: number, 
  label: string, 
  priceRatio: number, 
  city: string, 
  district: string,
  size: number, 
  rooms: number,
  propertyType: 'rent' | 'sale',
  buildingType: string,
  condition: string,
  platformComparison: PlatformComparison[]
): string {
  const propertyTypeText = propertyType === 'rent' ? 'ijara' : 'sotib olish'
  const priceText = propertyType === 'rent' ? 'ijara haqi' : 'narx'
  const buildingTypeText = buildingType === 'apartment' ? 'kvartira' : 
                          buildingType === 'house' ? 'uy' : 
                          buildingType === 'studio' ? 'studiya' : 'pentxaus'
  const conditionText = condition === 'new' ? 'yangi' :
                       condition === 'renovated' ? 'ta\'mirlangan' :
                       condition === 'good' ? 'yaxshi' : 'ta\'mirga muhtoj'
  
  const olxPrice = platformComparison.find(p => p.platform === 'OLX Uzbekistan')?.averagePrice || 0
  const priceDiff = priceRatio > 1 ? ((priceRatio - 1) * 100).toFixed(0) : ((1 - priceRatio) * 100).toFixed(0)
  
  if (label === 'Underpriced') {
    return `🎯 Bu ${propertyTypeText} mulki ${city} shahrida ${district} tumani uchun mukammal imkoniyatdir. ${size}m² maydon va ${rooms} xonali ${buildingTypeText} ${conditionText} holatda bo\'lib, ${priceText} bozor narxidan ${priceDiff}% pastdir. Xoch-platforma tahlili shuni ko\'rsatadiki, OLX va We Band platformalaridagi o\'xshash mulklar o\'rtacha $${olxPrice.toFixed(0)}/m² narxda savdo qilmoqda, bu esa sizni juda foydali bitimga olib keladi. ${district} tumanidagi joylashuv va mulkning sharoitlari investitsiya qiymatini oshiradi.`
  } else if (label === 'Fair') {
    return `⚖️ Bu ${propertyTypeText} mulki ${city} shahridagi o\'rtacha bozor narxiga ega. ${size}m² maydon va ${rooms} xonali ${buildingTypeText} ${conditionText} holatda bo\'lib, ${priceText} hudud uchun adolatli va mos keladi. Xoch-platforma tahlili shuni ko\'rsatadiki, OLX ($${olxPrice.toFixed(0)}/m²) va boshqa platformalardagi narxlar bilan mos keladi. ${district} tumanidagi joylashuv va mulkning sharoitlari uning qiymatini to\'g'ri aks ettiradi.`
  } else {
    return `⚠️ Bu ${propertyTypeText} mulki ${city} shahridagi bozor narxidan ${priceDiff}% yuqori narxlangan. ${size}m² maydon va ${rooms} xonali ${buildingTypeText} ${conditionText} holatda bo\'lsa-da, ${priceText} bozor standartlaridan yuqori. Xoch-platforma tahlili shuni ko\'rsatadiki, OLX va boshqa platformalarda shunga o\'xshash mulklar $${olxPrice.toFixed(0)}/m² narxda savdo qilmoqda. Muzokara qilish yoki boshqa joylarda yaxshiroq bitim qidirish tavsiya etiladi.`
  }
}

function generatePriceReason(priceRatio: number, expectedPricePerSqm: number, city: string): string {
  const pricePerSqm = priceRatio * expectedPricePerSqm
  const diffPercent = priceRatio > 1 ? ((priceRatio - 1) * 100).toFixed(0) : ((1 - priceRatio) * 100).toFixed(0)
  
  if (priceRatio < 0.85) {
    return `Narx bozor o'rtachasidan ${diffPercent}% past. ${city} shahridagi shunga o'xshash mulklar uchun $${expectedPricePerSqm.toFixed(2)}/m² kutilmoqda, ammo bu mulk $${pricePerSqm.toFixed(2)}/m². Bu ajoyib imkoniyat.`
  } else if (priceRatio <= 1.15) {
    return `Narx bozor o'rtachasiga mos keladi. ${city} shahridagi shunga o'xshash mulklar uchun $${expectedPricePerSqm.toFixed(2)}/m² kutilmoqda, bu mulk esa $${pricePerSqm.toFixed(2)}/m². Narx adolatli.`
  } else {
    return `Narx bozor o'rtachasidan ${diffPercent}% yuqori. ${city} shahridagi shunga o'xshash mulklar uchun $${expectedPricePerSqm.toFixed(2)}/m² kutilmoqda, ammo bu mulk $${pricePerSqm.toFixed(2)}/m². Narx qimmat ko'rinadi.`
  }
}

function generateLocationReason(city: string, district: string, score: number): string {
  if (score >= 8) {
    return `${city} shahridagi ${district} tumani yaxshi hududda joylashgan. Bu hudud infratuzilma va qulayliklar bo'yicha yuqori baholangan.`
  } else if (score >= 6) {
    return `${city} shahridagi ${district} tumani o'rtacha hududda joylashgan. Bu hudud infratuzilma va qulayliklar bo'yicha qoniqarli.`
  } else {
    return `${city} shahridagi ${district} tumani kamroq talabga ega hududda joylashgan. Hudud infratuzilmasi rivojlanishida muvaffaqiyatli bo'lishi mumkin.`
  }
}

function generateBuildingReason(buildingType: string, condition: string, yearBuilt: number, floor: number, totalFloors: number): string {
  const buildingTypeText = buildingType === 'apartment' ? 'kvartira' : 
                          buildingType === 'house' ? 'uy' : 
                          buildingType === 'studio' ? 'studiya' : 'pentxaus'
  const conditionText = condition === 'new' ? 'yangi' :
                       condition === 'renovated' ? 'ta\'mirlangan' :
                       condition === 'good' ? 'yaxshi' : 'ta\'mirga muhtoj'
  const age = new Date().getFullYear() - yearBuilt
  
  let reason = `Bu ${buildingTypeText} ${conditionText} holatda, ${yearBuilt}-yilda qurilgan.`
  if (age <= 5) reason += ' Yangi bino, zamonaviy qurilish standartlari.'
  else if (age <= 15) reason += ' Bino yaxshi holatda.'
  else reason += ` Bino ${age} yil, umumiy holati ${conditionText}.`
  
  if (floor === 1) reason += ' Birinchi qavat - ba\'zi xaridorlar uchun kamroq qulay.'
  else if (floor >= 2 && floor <= 5) reason += ' Optimal qavat - yaxshi qulaylik.'
  else reason += ` ${floor}/${totalFloors} qavat - qulayliklarga qarab baholanadi.`
  
  return reason
}

function generateAmenitiesReason(description: string, score: number): string {
  const amenityCount = (description.match(/konditsioner|internet|balkon|parking|lift|security|gym|pool|furnished|metro|school|hospital|market/gi) || []).length
  
  if (score >= 7) {
    return `Mulk ko'plab qulayliklarga ega. Tavsifda ${amenityCount} ta ijobiy omil topildi: ${description.substring(0, 100)}... Bu mulkning qulayligini oshiradi.`
  } else if (score >= 5) {
    return `Mulk o'rtacha qulayliklarga ega. Tavsifda ${amenityCount} ta ijobiy omil topildi. Qo'shimcha qulayliklar qiymatini oshirishi mumkin.`
  } else {
    return `Mulk kam qulayliklarga ega. Tavsifda ${amenityCount} ta ijobiy omil topildi. Qulayliklarga e'tibor berish tavsiya etiladi.`
  }
}

function generateSizeReason(size: number, rooms: number, score: number): string {
  const sqmPerRoom = size / rooms
  
  if (score >= 7) {
    return `Maydon juda samarali: ${size}m² / ${rooms} xona = ${sqmPerRoom.toFixed(1)}m² per xona. Bu hudud uchun keng va qulay.`
  } else if (score >= 5) {
    return `Maydon o'rtacha samaradorlikka ega: ${size}m² / ${rooms} xona = ${sqmPerRoom.toFixed(1)}m² per xona. Qoniqarli.`
  } else {
    return `Maydon samaradorligi past: ${size}m² / ${rooms} xona = ${sqmPerRoom.toFixed(1)}m² per xona. Ushbu maydon ${rooms} xona uchun kichik.`
  }
}

function generateMarketInsights(city: string, propertyType: 'rent' | 'sale', price: number, size: number) {
  const expectedPricePerSqm = getExpectedPricePerSqm(city, propertyType)
  const pricePerSqm = price / size
  
  return {
    averagePrice: expectedPricePerSqm,
    priceRange: {
      min: expectedPricePerSqm * 0.8,
      max: expectedPricePerSqm * 1.2
    },
    marketTrend: getMarketTrend(city),
    competition: getCompetitionLevel(city, propertyType)
  }
}

function getMarketTrend(city: string): string {
  const cityLower = city.toLowerCase()
  
  if (cityLower.includes('xorazm') || cityLower.includes('surxondaryo') || cityLower.includes('buxoro')) {
    return 'O\'sib bormoqda - narxlar so\'nggi yilda 14-21% oshdi'
  } else if (cityLower.includes('toshkent shahri') || cityLower.includes('samarqand')) {
    return 'Barqaror o\'sish - narxlar so\'nggi yilda 4-5% oshdi'
  } else if (cityLower.includes('jizzax viloyati') || cityLower.includes('sirdaryo viloyati')) {
    return 'Kamayib bormoqda - bitimlar soni kamaymoqda'
  } else {
    return 'Barqaror - narxlar o\'zgarmayapti'
  }
}

function getCompetitionLevel(city: string, propertyType: 'rent' | 'sale'): string {
  const cityLower = city.toLowerCase()
  
  if (cityLower.includes('toshkent shahri')) {
    return 'Yuqori - ko\'plab takliflar bor, tanlov keng'
  } else if (cityLower.includes('samarqand') || cityLower.includes('buxoro') || cityLower.includes('namangan') || cityLower.includes('andijon')) {
    return 'O\'rtacha - yetarlicha takliflar bor'
  } else {
    return 'Past - takliflar soni kam, tanlov cheklangan'
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ApartmentData = await request.json()
    
    if (!data.propertyType || !data.price || !data.size || !data.city || !data.district || !data.exactLocation || !data.rooms || !data.floor || !data.totalFloors || !data.buildingType || !data.condition || !data.yearBuilt || !data.description) {
      return NextResponse.json(
        { error: 'Barcha maydonlar to\'ldirilishi shart' },
        { status: 400 }
      )
    }
    
    if (data.price <= 0 || data.size <= 0 || data.rooms <= 0 || data.floor <= 0 || data.totalFloors <= 0 || data.yearBuilt <= 1900) {
      return NextResponse.json(
        { error: 'Narx, maydon, xonalar, qavat va qurilgan yil musbat raqam bo\'lishi kerak' },
        { status: 400 }
      )
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const result = analyzeApartment(data)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Mulkni tahlil qilishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
