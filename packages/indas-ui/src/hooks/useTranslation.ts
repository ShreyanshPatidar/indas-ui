import { useLanguage } from '@/contexts/LanguageContext'

export function useTranslation() {
    const { translations, language, setLanguage } = useLanguage()

    const t = (text: string, options?: Record<string, any>): string => {
        // If language is English, return text as is (with interpolation)
        let result = language === 'en' ? text : (translations[text] || text)

        // Handle interpolation
        if (options) {
            Object.keys(options).forEach(key => {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(options[key]))
            })
        }

        return result
    }

    return { t, language, setLanguage }
}
