'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Language } from '@/types'

// Translations for Terms of Service
const translations = {
  en: {
    backToApp: 'Back to App',
    title: 'Terms of Service',
    lastUpdated: 'Last updated: January 2025',
    privacyPolicy: 'Privacy Policy',
    sections: {
      introduction: {
        title: '1. Introduction',
        content: 'Welcome to memesocial.app. By accessing or using our service, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our service.'
      },
      serviceDescription: {
        title: '2. Service Description',
        content: 'memesocial.app is a tool that allows users to create mock-up chat screenshots for WhatsApp. The service is intended for entertainment, educational, and creative purposes only.'
      },
      acceptableUse: {
        title: '3. Acceptable Use',
        intro: 'You agree to use memesocial.app only for lawful purposes. You must not use our service to:',
        items: [
          'Create content intended to deceive, defraud, or mislead others',
          'Impersonate real individuals with malicious intent',
          'Create fake evidence for legal proceedings',
          'Harass, bully, or defame any person',
          'Spread misinformation or fake news',
          'Violate any applicable laws or regulations',
          'Infringe upon the intellectual property rights of others'
        ]
      },
      userResponsibility: {
        title: '4. User Responsibility',
        content: 'You are solely responsible for the content you create using our service. memesocial.app does not monitor, review, or store the content you generate. You acknowledge that any misuse of generated content is your responsibility and may have legal consequences.'
      },
      subscription: {
        title: '5. Subscription and Payments',
        intro: 'Some features of memesocial.app require a paid subscription (Pro Plan). By subscribing:',
        items: [
          'You agree to pay all applicable fees for your chosen plan',
          'Subscriptions are billed on a recurring basis until cancelled',
          'You may cancel your subscription at any time through your account settings',
          'Refunds are handled according to our refund policy'
        ]
      },
      intellectualProperty: {
        title: '6. Intellectual Property',
        content: 'The memesocial.app service, including its design, features, and code, is owned by us and protected by intellectual property laws. WhatsApp and other platform designs are trademarks of their respective owners. We do not claim any affiliation with WhatsApp or Meta Platforms, Inc.'
      },
      disclaimer: {
        title: '7. Disclaimer',
        content: 'memesocial.app is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. We are not responsible for any damages arising from the use or inability to use our service.'
      },
      limitation: {
        title: '8. Limitation of Liability',
        content: 'To the maximum extent permitted by law, memesocial.app shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.'
      },
      changes: {
        title: '9. Changes to Terms',
        content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to this page. Your continued use of the service after changes constitutes acceptance of the modified terms.'
      },
      termination: {
        title: '10. Termination',
        content: 'We may terminate or suspend your access to our service immediately, without prior notice, for any breach of these Terms of Service.'
      },
      contact: {
        title: '11. Contact Us',
        content: 'If you have any questions about these Terms of Service, please contact us at'
      }
    }
  },
  tr: {
    backToApp: 'Uygulamaya Dön',
    title: 'Kullanım Koşulları',
    lastUpdated: 'Son güncelleme: Ocak 2025',
    privacyPolicy: 'Gizlilik Politikası',
    sections: {
      introduction: {
        title: '1. Giriş',
        content: 'memesocial.app\'e hoş geldiniz. Hizmetimize erişerek veya kullanarak, bu Kullanım Koşullarına bağlı olmayı kabul edersiniz. Bu koşulların herhangi bir kısmını kabul etmiyorsanız, hizmetimizi kullanamazsınız.'
      },
      serviceDescription: {
        title: '2. Hizmet Açıklaması',
        content: 'memesocial.app, kullanıcıların WhatsApp için sahte sohbet ekran görüntüleri oluşturmasını sağlayan bir araçtır. Hizmet yalnızca eğlence, eğitim ve yaratıcı amaçlar için tasarlanmıştır.'
      },
      acceptableUse: {
        title: '3. Kabul Edilebilir Kullanım',
        intro: 'memesocial.app\'i yalnızca yasal amaçlar için kullanmayı kabul edersiniz. Hizmetimizi şu amaçlarla kullanamazsınız:',
        items: [
          'Başkalarını aldatmak, dolandırmak veya yanıltmak amacıyla içerik oluşturmak',
          'Kötü niyetle gerçek kişileri taklit etmek',
          'Hukuki işlemler için sahte kanıt oluşturmak',
          'Herhangi bir kişiyi taciz etmek, zorbalık yapmak veya karalamak',
          'Yanlış bilgi veya sahte haber yaymak',
          'Geçerli yasa veya düzenlemeleri ihlal etmek',
          'Başkalarının fikri mülkiyet haklarını ihlal etmek'
        ]
      },
      userResponsibility: {
        title: '4. Kullanıcı Sorumluluğu',
        content: 'Hizmetimizi kullanarak oluşturduğunuz içerikten yalnızca siz sorumlusunuz. memesocial.app, oluşturduğunuz içeriği izlemez, incelemez veya saklamaz. Oluşturulan içeriğin herhangi bir kötüye kullanımının sizin sorumluluğunuzda olduğunu ve yasal sonuçlar doğurabileceğini kabul edersiniz.'
      },
      subscription: {
        title: '5. Abonelik ve Ödemeler',
        intro: 'memesocial.app\'in bazı özellikleri ücretli abonelik (Pro Plan) gerektirir. Abone olarak:',
        items: [
          'Seçtiğiniz plan için geçerli tüm ücretleri ödemeyi kabul edersiniz',
          'Abonelikler iptal edilene kadar yinelenen bir şekilde faturalandırılır',
          'Aboneliğinizi hesap ayarlarınızdan istediğiniz zaman iptal edebilirsiniz',
          'İadeler, iade politikamıza göre işlenir'
        ]
      },
      intellectualProperty: {
        title: '6. Fikri Mülkiyet',
        content: 'memesocial.app hizmeti, tasarımı, özellikleri ve kodu dahil olmak üzere bize aittir ve fikri mülkiyet yasalarıyla korunmaktadır. WhatsApp ve diğer platform tasarımları, ilgili sahiplerinin ticari markalarıdır. WhatsApp veya Meta Platforms, Inc. ile herhangi bir bağlantı iddia etmiyoruz.'
      },
      disclaimer: {
        title: '7. Sorumluluk Reddi',
        content: 'memesocial.app, herhangi bir garanti olmaksızın "olduğu gibi" sunulmaktadır. Hizmetin kesintisiz, güvenli veya hatasız olacağını garanti etmiyoruz. Hizmetimizin kullanımından veya kullanılamamasından kaynaklanan herhangi bir zarardan sorumlu değiliz.'
      },
      limitation: {
        title: '8. Sorumluluk Sınırlaması',
        content: 'Yasaların izin verdiği azami ölçüde, memesocial.app hizmeti kullanımınızdan kaynaklanan dolaylı, arızi, özel, sonuçsal veya cezai zararlardan sorumlu tutulamaz.'
      },
      changes: {
        title: '9. Koşullarda Değişiklikler',
        content: 'Bu koşulları istediğimiz zaman değiştirme hakkını saklı tutuyoruz. Değişiklikler bu sayfada yayınlandığı anda yürürlüğe girecektir. Değişikliklerden sonra hizmeti kullanmaya devam etmeniz, değiştirilmiş koşulları kabul ettiğiniz anlamına gelir.'
      },
      termination: {
        title: '10. Fesih',
        content: 'Bu Kullanım Koşullarının herhangi bir ihlali durumunda, önceden haber vermeksizin hizmetimize erişiminizi derhal sonlandırabilir veya askıya alabiliriz.'
      },
      contact: {
        title: '11. Bize Ulaşın',
        content: 'Bu Kullanım Koşulları hakkında herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin:'
      }
    }
  }
}

export default function TermsOfServicePage() {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    // Try to get language from localStorage
    const savedLang = localStorage.getItem('chat-language')
    if (savedLang === 'tr' || savedLang === 'en') {
      setLanguage(savedLang)
    }
  }, [])

  const t = translations[language]

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'tr' : 'en'
    setLanguage(newLang)
    localStorage.setItem('chat-language', newLang)
  }

  return (
    <div className="min-h-screen bg-background overflow-auto h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header with Back Link and Language Toggle */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToApp}
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'TR' : 'EN'}
          </Button>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.lastUpdated}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.introduction.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.introduction.content}
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.serviceDescription.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.serviceDescription.content}
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.acceptableUse.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.acceptableUse.intro}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.acceptableUse.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* User Responsibility */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.userResponsibility.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.userResponsibility.content}
            </p>
          </section>

          {/* Subscription and Payments */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.subscription.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.subscription.intro}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.subscription.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.intellectualProperty.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.intellectualProperty.content}
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.disclaimer.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.disclaimer.content}
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.limitation.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.limitation.content}
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.changes.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.changes.content}
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.termination.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.termination.content}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.contact.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.contact.content}{' '}
              <a href="mailto:support@memesocial.app" className="text-primary hover:underline">
                support@memesocial.app
              </a>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground">
              {t.privacyPolicy}
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-foreground">
              {t.backToApp}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
