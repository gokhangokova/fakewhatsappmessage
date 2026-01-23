'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Language } from '@/types'

// Translations for Privacy Policy
const translations = {
  en: {
    backToApp: 'Back to App',
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: January 2025',
    termsOfService: 'Terms of Service',
    sections: {
      introduction: {
        title: '1. Introduction',
        content: 'At memesocial.app, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our service.'
      },
      informationWeCollect: {
        title: '2. Information We Collect',
        youProvide: {
          title: '2.1 Information You Provide',
          items: [
            'Account information (email address, username) when you create an account',
            'Payment information when you subscribe to Pro Plan (processed by third-party payment providers)',
            'Communications you send to us (support requests, feedback)'
          ]
        },
        automatic: {
          title: '2.2 Information Collected Automatically',
          items: [
            'Usage data (pages visited, features used, time spent)',
            'Device information (browser type, operating system)',
            'IP address and general location data'
          ]
        },
        contentYouCreate: {
          title: '2.3 Content You Create',
          important: 'Important:',
          content: 'The chat content you create using our editor is processed entirely in your browser. We do not collect, store, or have access to the messages, names, or images you use in your mock-up screenshots.'
        }
      },
      howWeUse: {
        title: '3. How We Use Your Information',
        intro: 'We use the information we collect to:',
        items: [
          'Provide and maintain our service',
          'Process your subscription payments',
          'Send important updates about your account or our service',
          'Respond to your support requests',
          'Analyze usage patterns to improve our service',
          'Detect and prevent fraud or abuse'
        ]
      },
      dataStorage: {
        title: '4. Data Storage and Security',
        content1: 'We implement appropriate security measures to protect your personal information. Your account data is stored securely on our servers. Payment information is processed by trusted third-party payment providers and is not stored on our servers.',
        content2: 'As mentioned above, the content you create (chat messages, names, avatars) is processed locally in your browser and is not transmitted to or stored on our servers.'
      },
      cookies: {
        title: '5. Cookies and Tracking',
        intro: 'We use cookies and similar technologies for:',
        items: [
          'Keeping you signed in to your account',
          'Remembering your preferences',
          'Analytics to understand how our service is used'
        ],
        note: 'You can control cookies through your browser settings. Note that disabling cookies may affect some functionality of our service.'
      },
      thirdParty: {
        title: '6. Third-Party Services',
        intro: 'We may use third-party services that collect information about you:',
        items: [
          'Payment processors (for subscription payments)',
          'Analytics providers (to understand usage patterns)',
          'Authentication providers (for sign-in services)'
        ],
        note: 'These third parties have their own privacy policies governing the use of your information.'
      },
      dataSharing: {
        title: '7. Data Sharing',
        intro: 'We do not sell your personal information. We may share your information only in the following cases:',
        items: [
          'With your consent',
          'To comply with legal obligations',
          'To protect our rights and prevent fraud',
          'With service providers who assist in operating our service (under strict confidentiality)'
        ]
      },
      yourRights: {
        title: '8. Your Rights',
        intro: 'Depending on your location, you may have the following rights:',
        items: [
          'Access your personal data',
          'Correct inaccurate data',
          'Delete your account and associated data',
          'Export your data',
          'Opt-out of marketing communications'
        ],
        contact: 'To exercise these rights, please contact us at'
      },
      childrenPrivacy: {
        title: "9. Children's Privacy",
        content: 'Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.'
      },
      internationalTransfers: {
        title: '10. International Data Transfers',
        content: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.'
      },
      changes: {
        title: '11. Changes to This Policy',
        content: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting a notice on our website or sending you an email. Your continued use of the service after changes constitutes acceptance of the updated policy.'
      },
      contact: {
        title: '12. Contact Us',
        content: 'If you have any questions about this Privacy Policy, please contact us at'
      }
    }
  },
  tr: {
    backToApp: 'Uygulamaya Dön',
    title: 'Gizlilik Politikası',
    lastUpdated: 'Son güncelleme: Ocak 2025',
    termsOfService: 'Kullanım Koşulları',
    sections: {
      introduction: {
        title: '1. Giriş',
        content: 'memesocial.app olarak gizliliğinizi ciddiye alıyoruz. Bu Gizlilik Politikası, hizmetimizi kullandığınızda bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.'
      },
      informationWeCollect: {
        title: '2. Topladığımız Bilgiler',
        youProvide: {
          title: '2.1 Sizin Sağladığınız Bilgiler',
          items: [
            'Hesap oluşturduğunuzda hesap bilgileri (e-posta adresi, kullanıcı adı)',
            'Pro Plan\'a abone olduğunuzda ödeme bilgileri (üçüncü taraf ödeme sağlayıcıları tarafından işlenir)',
            'Bize gönderdiğiniz iletişimler (destek talepleri, geri bildirimler)'
          ]
        },
        automatic: {
          title: '2.2 Otomatik Olarak Toplanan Bilgiler',
          items: [
            'Kullanım verileri (ziyaret edilen sayfalar, kullanılan özellikler, harcanan süre)',
            'Cihaz bilgileri (tarayıcı türü, işletim sistemi)',
            'IP adresi ve genel konum verileri'
          ]
        },
        contentYouCreate: {
          title: '2.3 Oluşturduğunuz İçerik',
          important: 'Önemli:',
          content: 'Editörümüzü kullanarak oluşturduğunuz sohbet içeriği tamamen tarayıcınızda işlenir. Sahte ekran görüntülerinizde kullandığınız mesajları, isimleri veya resimleri toplamıyoruz, saklamıyoruz veya bunlara erişimimiz yok.'
        }
      },
      howWeUse: {
        title: '3. Bilgilerinizi Nasıl Kullanıyoruz',
        intro: 'Topladığımız bilgileri şu amaçlarla kullanıyoruz:',
        items: [
          'Hizmetimizi sağlamak ve sürdürmek',
          'Abonelik ödemelerinizi işlemek',
          'Hesabınız veya hizmetimiz hakkında önemli güncellemeler göndermek',
          'Destek taleplerinize yanıt vermek',
          'Hizmetimizi iyileştirmek için kullanım kalıplarını analiz etmek',
          'Dolandırıcılık veya kötüye kullanımı tespit etmek ve önlemek'
        ]
      },
      dataStorage: {
        title: '4. Veri Depolama ve Güvenlik',
        content1: 'Kişisel bilgilerinizi korumak için uygun güvenlik önlemleri uyguluyoruz. Hesap verileriniz sunucularımızda güvenli bir şekilde saklanır. Ödeme bilgileri güvenilir üçüncü taraf ödeme sağlayıcıları tarafından işlenir ve sunucularımızda saklanmaz.',
        content2: 'Yukarıda belirtildiği gibi, oluşturduğunuz içerik (sohbet mesajları, isimler, avatarlar) tarayıcınızda yerel olarak işlenir ve sunucularımıza iletilmez veya saklanmaz.'
      },
      cookies: {
        title: '5. Çerezler ve İzleme',
        intro: 'Çerezleri ve benzer teknolojileri şu amaçlarla kullanıyoruz:',
        items: [
          'Hesabınızda oturumunuzun açık kalmasını sağlamak',
          'Tercihlerinizi hatırlamak',
          'Hizmetimizin nasıl kullanıldığını anlamak için analitik'
        ],
        note: 'Çerezleri tarayıcı ayarlarınız üzerinden kontrol edebilirsiniz. Çerezleri devre dışı bırakmanın hizmetimizin bazı işlevlerini etkileyebileceğini unutmayın.'
      },
      thirdParty: {
        title: '6. Üçüncü Taraf Hizmetleri',
        intro: 'Hakkınızda bilgi toplayan üçüncü taraf hizmetleri kullanabiliriz:',
        items: [
          'Ödeme işlemcileri (abonelik ödemeleri için)',
          'Analitik sağlayıcıları (kullanım kalıplarını anlamak için)',
          'Kimlik doğrulama sağlayıcıları (oturum açma hizmetleri için)'
        ],
        note: 'Bu üçüncü tarafların bilgilerinizin kullanımını yöneten kendi gizlilik politikaları vardır.'
      },
      dataSharing: {
        title: '7. Veri Paylaşımı',
        intro: 'Kişisel bilgilerinizi satmıyoruz. Bilgilerinizi yalnızca aşağıdaki durumlarda paylaşabiliriz:',
        items: [
          'Onayınızla',
          'Yasal yükümlülüklere uymak için',
          'Haklarımızı korumak ve dolandırıcılığı önlemek için',
          'Hizmetimizi işletmemize yardımcı olan hizmet sağlayıcılarla (sıkı gizlilik altında)'
        ]
      },
      yourRights: {
        title: '8. Haklarınız',
        intro: 'Bulunduğunuz konuma bağlı olarak aşağıdaki haklara sahip olabilirsiniz:',
        items: [
          'Kişisel verilerinize erişim',
          'Yanlış verileri düzeltme',
          'Hesabınızı ve ilişkili verileri silme',
          'Verilerinizi dışa aktarma',
          'Pazarlama iletişimlerinden çıkma'
        ],
        contact: 'Bu hakları kullanmak için lütfen bizimle iletişime geçin:'
      },
      childrenPrivacy: {
        title: '9. Çocukların Gizliliği',
        content: 'Hizmetimiz 13 yaşın altındaki çocuklar için tasarlanmamıştır. 13 yaşın altındaki çocuklardan bilerek kişisel bilgi toplamıyoruz. Ebeveyn veya vasi iseniz ve çocuğunuzun bize kişisel bilgi sağladığına inanıyorsanız, lütfen bizimle iletişime geçin.'
      },
      internationalTransfers: {
        title: '10. Uluslararası Veri Transferleri',
        content: 'Bilgileriniz kendi ülkeniz dışındaki ülkelere aktarılabilir ve orada işlenebilir. Bilgilerinizi yürürlükteki veri koruma yasalarına uygun olarak korumak için uygun önlemlerin alınmasını sağlıyoruz.'
      },
      changes: {
        title: '11. Bu Politikadaki Değişiklikler',
        content: 'Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikleri web sitemizde bir bildirim yayınlayarak veya size e-posta göndererek size bildireceğiz. Değişikliklerden sonra hizmeti kullanmaya devam etmeniz, güncellenmiş politikayı kabul ettiğiniz anlamına gelir.'
      },
      contact: {
        title: '12. Bize Ulaşın',
        content: 'Bu Gizlilik Politikası hakkında herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin:'
      }
    }
  }
}

export default function PrivacyPolicyPage() {
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

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.informationWeCollect.title}</h2>

            <h3 className="text-lg font-medium mt-6 mb-3">{t.sections.informationWeCollect.youProvide.title}</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.informationWeCollect.youProvide.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">{t.sections.informationWeCollect.automatic.title}</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.informationWeCollect.automatic.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">{t.sections.informationWeCollect.contentYouCreate.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{t.sections.informationWeCollect.contentYouCreate.important}</strong>{' '}
              {t.sections.informationWeCollect.contentYouCreate.content}
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.howWeUse.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.howWeUse.intro}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.howWeUse.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.dataStorage.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.dataStorage.content1}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.dataStorage.content2}
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.cookies.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.cookies.intro}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.cookies.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              {t.sections.cookies.note}
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.thirdParty.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.thirdParty.intro}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.thirdParty.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              {t.sections.thirdParty.note}
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.dataSharing.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.dataSharing.intro}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.dataSharing.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.yourRights.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t.sections.yourRights.intro}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              {t.sections.yourRights.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              {t.sections.yourRights.contact}{' '}
              <a href="mailto:privacy@memesocial.app" className="text-primary hover:underline">
                privacy@memesocial.app
              </a>
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.childrenPrivacy.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.childrenPrivacy.content}
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.internationalTransfers.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.internationalTransfers.content}
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.changes.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.changes.content}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.sections.contact.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.sections.contact.content}{' '}
              <a href="mailto:privacy@memesocial.app" className="text-primary hover:underline">
                privacy@memesocial.app
              </a>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/terms-of-service" className="hover:text-foreground">
              {t.termsOfService}
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
