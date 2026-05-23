'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'hi' | 'fr' | 'de' | 'es'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    translations: Record<string, string>
    isLoading: boolean
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')
    const [translations, setTranslations] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)

    // Load saved language on mount
    useEffect(() => {
        const savedLang = localStorage.getItem('app-language')
        if (savedLang) {
            const normalizedLang = savedLang.toLowerCase() as Language
            if (['en', 'hi', 'fr', 'de', 'es'].includes(normalizedLang)) {
                setLanguageState(normalizedLang)
            }
        }
        setIsLoading(false)
    }, [])

    // Load translations when language changes
    useEffect(() => {
        const loadTranslations = async () => {
            if (language === 'en') {
                setTranslations({})
                return
            }

            try {
                const module = await import(`../locales/${language}.json`)
                setTranslations(module.default)
            } catch (error) {
                console.error(`Failed to load translations for ${language}`, error)
                setTranslations({})
            }
        }

        loadTranslations()
        localStorage.setItem('app-language', language)
    }, [language])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
    }

    // Translation function - returns translated text or falls back to key
    const t = (key: string): string => {
        if (language === 'en') return key
        return translations[key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, translations, isLoading, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
